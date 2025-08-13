#!/usr/bin/env python3
"""
Test script to verify Google Drive function integration
"""
import requests
import json
import sys

def test_google_drive_list_files():
    """Test the googledrive_list_files function"""
    print("🔍 Testing googledrive_list_files...")
    
    response = requests.post('http://localhost:8080/api/test-function', 
        json={
            'function_name': 'googledrive_list_files',
            'args': {
                'pageSize': 5,
                'orderBy': 'modifiedTime desc'
            }
        },
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Response size: {len(json.dumps(result))} bytes")
        print("Response preview:")
        print(json.dumps(result, indent=2)[:500] + "..." if len(json.dumps(result)) > 500 else json.dumps(result, indent=2))
        return result
    else:
        print(f"Error: {response.text}")
        return None

def test_google_drive_search_files():
    """Test the googledrive_search_files function"""
    print(f"\n🔍 Testing googledrive_search_files...")
    
    response = requests.post('http://localhost:8080/api/test-function', 
        json={
            'function_name': 'googledrive_search_files',
            'args': {
                'q': 'name contains "test"',
                'pageSize': 3
            }
        },
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Response size: {len(json.dumps(result))} bytes")
        print("Response preview:")
        print(json.dumps(result, indent=2)[:500] + "..." if len(json.dumps(result)) > 500 else json.dumps(result, indent=2))
        return result
    else:
        print(f"Error: {response.text}")
        return None

if __name__ == "__main__":
    print("🚀 Testing Google Drive Functions\n")
    
    # Test googledrive_list_files
    list_result = test_google_drive_list_files()
    
    if list_result and 'response' in list_result:
        print("\n✅ googledrive_list_files test completed")
    else:
        print("\n❌ googledrive_list_files test failed")
    
    # Test googledrive_search_files
    search_result = test_google_drive_search_files()
    
    if search_result and 'response' in search_result:
        print("\n✅ googledrive_search_files test completed")
    else:
        print("\n❌ googledrive_search_files test failed")
    
    print("\n🎉 Google Drive function tests completed!")
