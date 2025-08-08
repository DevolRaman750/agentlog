#!/usr/bin/env python3
"""
Test script to understand what's happening with Slack function calls
"""
import requests
import json
import sys

def test_slack_find_channel():
    """Test the slack_find_channel function"""
    print("🔍 Testing slack_find_channel...")
    
    response = requests.post('http://localhost:8080/api/test-function', 
        json={
            'function_name': 'slack_find_channel',
            'args': {
                'channel_name': 'ai-intern'
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

def test_slack_read_messages(channel_id):
    """Test the slack_read_messages function"""
    print(f"\n🔍 Testing slack_read_messages with channel_id: {channel_id}")
    
    response = requests.post('http://localhost:8080/api/test-function', 
        json={
            'function_name': 'slack_read_messages',
            'args': {
                'channel': channel_id,
                'limit': 10
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
    print("🚀 Testing Slack Functions\n")
    
    # Test slack_find_channel
    find_result = test_slack_find_channel()
    
    if find_result and 'response' in find_result:
        # Try to extract channel ID from the response
        response_data = find_result['response']
        if 'channels' in response_data and len(response_data['channels']) > 0:
            channel_id = response_data['channels'][0].get('id', 'UNKNOWN')
            print(f"\n✅ Found channel ID: {channel_id}")
            
            # Test slack_read_messages
            test_slack_read_messages(channel_id)
        else:
            print("\n❌ No channels found in response")
    else:
        print("\n❌ slack_find_channel failed")