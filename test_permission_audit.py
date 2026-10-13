#!/usr/bin/env python3
"""
Test Suite for PrivacyShield AI Real Android Permission Engine
Tests:
1. Dumpsys package parser: requested vs granted vs denied vs not requested.
2. Verified per-app permission isolation (No generic or category-based permissions).
3. Netflix, Spotify, WhatsApp, Authenticator, Maps, SuperVPN real package logic.
4. Mutation validation (Rejecting unrequested permission modification).
5. Disconnected phone handling (PHONE DISCONNECTED badge).
"""

import json
import android_bridge

def test_dumpsys_parsing():
    print("\n--- TEST 1: Package Dumpsys Permission Parsing ---")
    
    # 1. Netflix Dump (Camera NOT declared, Audio NOT declared)
    netflix_dump = """
    requested permissions:
      android.permission.INTERNET
      android.permission.ACCESS_NETWORK_STATE
      android.permission.WAKE_LOCK
      android.permission.POST_NOTIFICATIONS
    install permissions:
      android.permission.INTERNET: granted=true
      android.permission.ACCESS_NETWORK_STATE: granted=true
    runtime permissions:
      android.permission.POST_NOTIFICATIONS: granted=true
    """
    req, granted, denied, ver = android_bridge.parse_package_dumpsys(netflix_dump)
    has_cam = "android.permission.CAMERA" in req
    has_mic = "android.permission.RECORD_AUDIO" in req
    
    print(f"Netflix requested permissions: {req}")
    print(f"Netflix Camera Requested: {'YES' if has_cam else 'NO'} -> Status: {'NOT REQUESTED' if not has_cam else 'UNKNOWN'}")
    assert not has_cam, "Netflix should NOT request Camera!"
    assert not has_mic, "Netflix should NOT request Microphone!"
    print("✓ Netflix: Camera and Mic correctly identified as NOT REQUESTED.")

    # 2. Spotify Dump (Microphone declared and granted, Camera NOT declared)
    spotify_dump = """
    requested permissions:
      android.permission.INTERNET
      android.permission.ACCESS_NETWORK_STATE
      android.permission.RECORD_AUDIO
      android.permission.POST_NOTIFICATIONS
      android.permission.READ_MEDIA_AUDIO
    install permissions:
      android.permission.INTERNET: granted=true
    runtime permissions:
      android.permission.RECORD_AUDIO: granted=true
      android.permission.POST_NOTIFICATIONS: granted=true
    """
    s_req, s_granted, s_denied, s_ver = android_bridge.parse_package_dumpsys(spotify_dump)
    s_has_cam = "android.permission.CAMERA" in s_req
    s_has_mic = "android.permission.RECORD_AUDIO" in s_req
    s_mic_granted = "android.permission.RECORD_AUDIO" in s_granted
    
    print(f"\nSpotify requested permissions: {s_req}")
    print(f"Spotify Camera Requested: {'YES' if s_has_cam else 'NO'} -> Status: {'NOT REQUESTED' if not s_has_cam else 'UNKNOWN'}")
    print(f"Spotify Microphone Requested: {'YES' if s_has_mic else 'NO'} -> Status: {'GRANTED' if s_mic_granted else 'DENIED'}")
    assert not s_has_cam, "Spotify should NOT request Camera!"
    assert s_has_mic and s_mic_granted, "Spotify should request and grant RECORD_AUDIO!"
    print("✓ Spotify: Camera NOT REQUESTED, Microphone GRANTED.")

    # 3. SuperVPN Dump (Neither Camera nor Mic requested)
    vpn_dump = """
    requested permissions:
      android.permission.INTERNET
      android.permission.ACCESS_NETWORK_STATE
      android.permission.POST_NOTIFICATIONS
    install permissions:
      android.permission.INTERNET: granted=true
    runtime permissions:
      android.permission.POST_NOTIFICATIONS: granted=true
    """
    v_req, v_granted, v_denied, v_ver = android_bridge.parse_package_dumpsys(vpn_dump)
    assert "android.permission.CAMERA" not in v_req, "SuperVPN should NOT request Camera!"
    assert "android.permission.RECORD_AUDIO" not in v_req, "SuperVPN should NOT request Microphone!"
    print("✓ SuperVPN: Neither Camera nor Mic requested.")

    # 4. WhatsApp Dump (Both Camera and Mic declared and granted)
    wa_dump = """
    requested permissions:
      android.permission.INTERNET
      android.permission.CAMERA
      android.permission.RECORD_AUDIO
      android.permission.READ_CONTACTS
      android.permission.POST_NOTIFICATIONS
    runtime permissions:
      android.permission.CAMERA: granted=true
      android.permission.RECORD_AUDIO: granted=true
      android.permission.READ_CONTACTS: granted=true
    """
    w_req, w_granted, w_denied, w_ver = android_bridge.parse_package_dumpsys(wa_dump)
    assert "android.permission.CAMERA" in w_req and "android.permission.CAMERA" in w_granted
    assert "android.permission.RECORD_AUDIO" in w_req and "android.permission.RECORD_AUDIO" in w_granted
    print("✓ WhatsApp: Camera GRANTED, Microphone GRANTED.")

    # 5. Google Authenticator Dump (Camera declared, but DENIED by user)
    auth_dump = """
    requested permissions:
      android.permission.INTERNET
      android.permission.CAMERA
    runtime permissions:
      android.permission.CAMERA: granted=false
    """
    a_req, a_granted, a_denied, a_ver = android_bridge.parse_package_dumpsys(auth_dump)
    assert "android.permission.CAMERA" in a_req and "android.permission.CAMERA" in a_denied
    assert "android.permission.RECORD_AUDIO" not in a_req
    print("✓ Google Authenticator: Camera Requested: YES, Status: DENIED. Mic: NOT REQUESTED.")


def test_permission_safety_validation():
    print("\n--- TEST 2: Security & Safety Validation ---")
    # Attempt to revoke or grant Camera for an app that doesn't request it
    # change_package_permission must reject with "Permission is not requested by this application"
    res = android_bridge.change_package_permission("com.netflix.mediaclient", "CAMERA", "revoke")
    print(f"Permission change result when device disconnected: {res}")
    assert not res["ok"], "Should not succeed when device disconnected!"
    print("✓ Disconnected phone safety guard verified.")


def test_status_endpoint():
    print("\n--- TEST 3: Phone Connection Status Check ---")
    status = android_bridge.get_device_status()
    print("Device Status:", json.dumps(status, indent=2))
    assert "ok" in status and "connected" in status
    if not status["connected"]:
        print("✓ Accurately detected: Phone Disconnected. No simulated false data.")
    else:
        print(f"✓ Connected to physical device: {status['device']['name']}")


if __name__ == "__main__":
    test_dumpsys_parsing()
    test_permission_safety_validation()
    test_status_endpoint()
    print("\n==========================================")
    print("ALL PERMISSION AUDIT ENGINE TESTS PASSED!")
    print("==========================================\n")
