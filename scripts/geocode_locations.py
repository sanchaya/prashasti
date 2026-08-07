#!/usr/bin/env python3
"""
Geocoding pipeline for Prashasti Sanchaya.

Generates district_counts.json files for awards with location data by:
1. Fetching P19/P551/Q57 QIDs from Wikidata
2. Geocoding location names using external API
3. Aggregating by district and outside Karnataka
4. Updating award registry has_location_data flags

Supports two geocoding methods:
- Direct: uses district name only (simple)
- Smart: uses place names, tries multiple attempts, falls back to administrative names
"""

import json
import requests
import time
from collections import defaultdict
import os

# Wikidata API endpoints
WIKIDATA_API = "https://www.wikidata.org/w/api.php"
GOOGLE_GEOCODE_API = "https://maps.googleapis.com/maps/api/geocode/json"

# Load existing data
with open('/Users/omshivaprakash/Claude/Projects/rajyotsava-site/data/awards.json', 'r') as f:
    AWARDS = json.load(f)

with open('/Users/omshivaprakash/Claude/Projects/rajyotsava-site/data/awards/rajyotsava-prashasti.json', 'r') as f:
    RAJYOTSAVA_DATA = json.load(f)

# Known district centers from district_counts.json
with open('/Users/omshivaprakash/Claude/Projects/rajyotsava-site/data/district_counts.json', 'r') as f:
    DISTRICT_COUNTS = json.load(f)

# District centers lookup: district_name -> {lat, lon, count}
DISTRICT_CENTERS = {d['district']: {'lat': d['lat'], 'lon': d['lon'], 'count': d['count']} 
                   for d in DISTRICT_COUNTS['districts']}

# Place coordinates cache - maps location name -> {lat, lon, type}
PLACE_COORDS_CACHE = {}

# Location name variations for better matching
LOCATION_VARIANTS = {
    'Bengaluru': ['Bengaluru Urban', 'Bengaluru Rural', 'Bengaluru', 'Bangalore', 'Bangalore Urban'],
    'Mumbai': ['Mumbai', 'Bombay'],
    'Chennai': ['Chennai', 'Madras'],
    'Delhi': ['Delhi', 'New Delhi'],
    'Kerala': ['Kerala', 'Kerela'],
}

# Known outside locations with coordinates (from current district_counts.json)
KNOWN_OUTSIDE_LOCATIONS = {
    'Mumbai': {'lat': 19.076, 'lon': 72.878, 'type': 'outside'},
    'Chennai': {'lat': 13.083, 'lon': 80.27, 'type': 'outside'},
    'Telangana': {'lat': 17.385, 'lon': 78.487, 'type': 'outside'},
    'Dubai': {'lat': 25.204, 'lon': 55.271, 'type': 'outside'},
    'Gulf Nation': {'lat': 24.7, 'lon': 54.5, 'type': 'outside'},
    'Saudi Arabia': {'lat': 24.713, 'lon': 46.675, 'type': 'outside'},
}

def fetch_wikidata_claims(qids, property):
    """Fetch claims for given QIDs from Wikidata."""
    if not qids:
        return {}

    results = {}
    
    for qid in qids:
        params = {
            'action': 'wbgetentities',
            'ids': qid,
            'props': 'claims',
            'format': 'json'
        }
        
        try:
            response = requests.get(WIKIDATA_API, params=params, timeout=5)
            data = response.json()
            
            if 'entities' in data and qid in data['entities']:
                claims = data['entities'][qid].get('claims', {})
                results[qid] = claims.get(property, [])
            else:
                results[qid] = []
                
        except Exception as e:
            print(f"  Error fetching Wikidata for {qid}: {e}")
            results[qid] = []
    
    return results

def get_location_from_claims(qid, claims_map):
    """Extract location from Wikidata claims."""
    if qid not in claims_map:
        return None
    
    # Try P19 (place), then P551 (residence), then P57 (director)
    for prop in ['P19', 'P551', 'P57']:
        if prop in claims_map[qid]:
            try:
                claim = claims_map[qid][prop][0]
                target = claim['mainsnak']['datavalue']['value']
                if isinstance(target, dict):
                    # Wikidata entity
                    return target['id']
                else:
                    # String value
                    return target
            except (KeyError, IndexError):
                continue
    
    return None

def get_location_name_from_wikidata(qid, labels):
    """Get location name from Wikidata labels."""
    if not labels:
        return None
    
    # Try Kannada label first, then English
    for lang in ['kn', 'en']:
        if lang in labels:
            return labels[lang]['value']
    
    return None

def geocode_place(location_name, qid=None, award_type='people'):
    """Geocode a place name using Google Maps API with fallbacks."""
    if not location_name or not location_name.strip():
        return None
    
    location_name = location_name.strip()
    
    # Check cache
    if location_name in PLACE_COORDS_CACHE:
        return PLACE_COORDS_CACHE[location_name]
    
    # Check known outside locations
    if location_name in KNOWN_OUTSIDE_LOCATIONS:
        PLACE_COORDS_CACHE[location_name] = KNOWN_OUTSIDE_LOCATIONS[location_name]
        return KNOWN_OUTSIDE_LOCATIONS[location_name]
    
    # Check if it's a known district
    if location_name in DISTRICT_CENTERS:
        result = {'lat': DISTRICT_CENTERS[location_name]['lat'],
                 'lon': DISTRICT_CENTERS[location_name]['lon'],
                 'type': 'district'}
        PLACE_COORDS_CACHE[location_name] = result
        return result
    
    # Try multiple variants
    variants = [location_name] + LOCATION_VARIANTS.get(location_name, []) + [location_name.lower()]
    
    for variant in variants:
        if variant in PLACE_COORDS_CACHE:
            return PLACE_COORDS_CACHE[variant]
    
    # Try geocoding API for people (P19/P551)
    if award_type == 'people':
        # For people, try geocoding the location directly
        params = {
            'address': location_name,
            'key': 'YOUR_GOOGLE_MAPS_API_KEY'  # Replace with actual API key
        }
        
        try:
            response = requests.get(GOOGLE_GEOCODE_API, params=params, timeout=5)
            data = response.json()
            
            if data.get('status') == 'OK' and data.get('results'):
                location = data['results'][0]['geometry']['location']
                result = {
                    'lat': location['lat'],
                    'lon': location['lon'],
                    'type': 'geocoded'
                }
                PLACE_COORDS_CACHE[location_name] = result
                return result
                
        except Exception as e:
            print(f"  Geocoding error for '{location_name}': {e}")
    
    # Fallback: try to match against known places
    location_name_lower = location_name.lower()
    for known_name, known_data in KNOWN_OUTSIDE_LOCATIONS.items():
        if known_name.lower() == location_name_lower:
            PLACE_COORDS_CACHE[location_name] = known_data
            return known_data
    
    # No match found
    return None

def process_award_for_locations(award_id, award_data):
    """Process an award's data to extract locations and generate district_counts.json."""
    print(f"\nProcessing award: {award_id}")
    
    # Collect all unique locations
    locations = {}
    
    for record in award_data:
        location = record.get('location')
        if not location:
            continue
            
        # Count occurrences
        locations[location] = locations.get(location, 0) + 1
    
    if not locations:
        print(f"  No locations found for {award_id}")
        return None
    
    print(f"  Found {len(locations)} unique locations: {list(locations.keys())}")
    
    # Geocode each location
    geocoordinated_locations = {}
    for location, count in locations.items():
        print(f"  Geocoding '{location}' ({count} occurrences)...")
        geo_result = geocode_place(location, award_id, award_id == 'national-film-award-best-kannada-film')
        if geo_result:
            geocoordinated_locations[location] = {
                **geo_result,
                'count': count,
                'display_name': location
            }
        else:
            print(f"    Could not geocode '{location}'")
    
    # If we couldn't geocode most locations, return None
    if not geocoordinated_locations:
        print(f"  Could not geocode any locations for {award_id}")
        return None
    
    # Group by district type
    district_counts = {
        'districts': [],
        'outside_karnataka': 0,
        'unmapped': len(locations) - len(geocoordinated_locations),
        'other_locations': []
    }
    
    # Process geocoordinated locations
    for location, data in geocoordinated_locations.items():
        if data['type'] == 'district':
            district_counts['districts'].append({
                'district': location,
                'count': data['count'],
                'lat': data['lat'],
                'lon': data['lon']
            })
        elif data['type'] == 'outside':
            district_counts['outside_karnataka'] += data['count']
            district_counts['other_locations'].append({
                'location': location,
                'count': data['count'],
                'lat': data['lat'],
                'lon': data['lon'],
                'type': data['type']
            })
        elif data['type'] == 'geocoded':
            # Check if it's within Karnataka bounds (approx)
            if 11.0 <= data['lat'] <= 16.0 and 74.0 <= data['lon'] <= 79.0:
                # Try to match to a known district
                district_found = False
                for district_name, district_data in DISTRICT_CENTERS.items():
                    # Simple distance check (in production, use proper GIS)
                    if abs(district_data['lat'] - data['lat']) < 1.0 and abs(district_data['lon'] - data['lon']) < 1.0:
                        district_counts['districts'].append({
                            'district': district_name,
                            'count': data['count'],
                            'lat': district_data['lat'],
                            'lon': district_data['lon']
                        })
                        district_found = True
                        break
                
                if not district_found:
                    # Add to other_locations
                    district_counts['other_locations'].append({
                        'location': location,
                        'count': data['count'],
                        'lat': data['lat'],
                        'lon': data['lon'],
                        'type': 'other'
                    })
            else:
                # Outside Karnataka
                district_counts['outside_karnataka'] += data['count']
                district_counts['other_locations'].append({
                    'location': location,
                    'count': data['count'],
                    'lat': data['lat'],
                    'lon': data['lon'],
                    'type': 'outside'
                })
        else:
            # Unknown type
            district_counts['other_locations'].append({
                'location': location,
                'count': data['count'],
                'lat': data['lat'],
                'lon': data['lon'],
                'type': data['type']
            })
    
    # Remove unmapped count
    del district_counts['unmapped']
    
    return district_counts

def update_award_registry():
    """Update awards.json to set has_location_data flags."""
    updated_awards = []
    
    for award in AWARDS:
        award_id = award['id']
        
        # Check if this award has location data
        has_location = False
        if award_id in ['rajyotsava-prashasti']:
            has_location = True
        elif award_id in ['karnataka-ratna', 'jnanpith-kannada', 'bharat-ratna-kannadiga']:
            # For now, let's assume these don't have location data
            has_location = False
        elif award_id == 'national-film-award-best-kannada-film':
            # Check if we can geocode director locations
            has_location = True
        
        if has_location:
            # Create a minimal district_counts.json for this award
            district_file = f'data/awards/{award_id}-district_counts.json'
            
            if award_id == 'rajyotsava-prashasti':
                # Use existing rajyotsava district data
                with open('/Users/omshivaprakash/Claude/Projects/rajyotsava-site/data/district_counts.json', 'r') as f:
                    data = json.load(f)
                data['award_id'] = award_id
                with open(district_file, 'w') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"  Created district data for {award_id} at {district_file}")
            
            award['has_location_data'] = has_location
            award['district_data_file'] = district_file
        
        updated_awards.append(award)
    
    # Write updated awards.json
    with open('/Users/omshivaprakash/Claude/Projects/rajyotsava-site/data/awards.json', 'w') as f:
        json.dump(updated_awards, f, indent=2, ensure_ascii=False)
    
    print(f"Updated awards.json with has_location_data flags")

def main():
    """Main geocoding pipeline."""
    print("Starting geocoding pipeline for Prashasti Sanchaya")
    print("=" * 60)
    
    # Step 1: Fetch Wikidata claims for awards with location data potential
    print("\nStep 1: Fetching Wikidata claims...")
    
    # Awards that might have location data
    location_awards = ['rajyotsava-prashasti', 'karnataka-ratna', 'jnanpith-kannada', 
                      'bharat-ratna-kannadiga', 'national-film-award-best-kannada-film']
    
    # Collect QIDs from these awards
    all_qids = []
    award_qids = {}
    
    for award_id in location_awards:
        # Find award in registry
        award = next((a for a in AWARDS if a['id'] == award_id), None)
        if not award:
            continue
        
        # Extract QIDs from award data
        qids = []
        if award_id == 'national-film-award-best-kannada-film':
            # Film award uses director field
            data_file = f"data/awards/{award_id}.json"
            if os.path.exists(data_file):
                with open(data_file, 'r') as f:
                    data = json.load(f)
                    for record in data:
                        if record.get('director'):
                            # Look up director QID
                            director_name = record['director']
                            # TODO: Map director name to QID
                            pass
        else:
            # People awards use wikidata_qid field
            data_file = f"data/awards/{award_id}.json"
            if os.path.exists(data_file):
                with open(data_file, 'r') as f:
                    data = json.load(f)
                    for record in data:
                        if record.get('wikidata_qid'):
                            qids.append(record['wikidata_qid'])
        
        award_qids[award_id] = qids
        all_qids.extend(qids)
    
    # Remove duplicates
    all_qids = list(set(all_qids))
    print(f"  Found {len(all_qids)} unique QIDs to process")
    
    # Step 2: Process each award for locations
    print("\nStep 2: Processing awards for location data...")
    
    for award_id in location_awards:
        # Skip if no location data expected
        if award_id == 'rajyotsava-prashasti':
            # Use existing rajyotsava data
            district_file = f"data/awards/{award_id}-district_counts.json"
            if os.path.exists(district_file):
                print(f"  Using existing district data for {award_id}")
                continue
            
        district_counts = process_award_for_locations(award_id, award_data)
        
        if district_counts:
            # Write district_counts.json
            district_file = f'data/awards/{award_id}-district_counts.json'
            with open(district_file, 'w') as f:
                json.dump(district_counts, f, indent=2, ensure_ascii=False)
            print(f"  Created {district_file}")
    
    # Step 3: Update award registry
    print("\nStep 3: Updating award registry...")
    update_award_registry()
    
    # Step 4: Create summary
    print("\nStep 4: Creating summary...")
    print("\nGeocoding pipeline completed!")
    print("\nGenerated district_counts.json files:")
    for award_id in location_awards:
        district_file = f"data/awards/{award_id}-district_counts.json"
        if os.path.exists(district_file):
            with open(district_file, 'r') as f:
                data = json.load(f)
            district_count = sum(d['count'] for d in data['districts']) + data['outside_karnataka']
            print(f"  {award_id}: {district_count} records, {len(data['districts'])} districts")

if __name__ == '__main__':
    main()