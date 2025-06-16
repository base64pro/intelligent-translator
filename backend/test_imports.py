import os
import sys

# Add the current directory to the path to ensure 'app' is found
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

print("--- Starting Import Test ---")
print(f"Current Path: {sys.path}")

try:
    print("\nAttempting to import 'user_profile' from 'app.schemas'...")
    from app.schemas import user_profile
    print("✅ SUCCESS: Imported 'user_profile' successfully!")
    print(f"Contents of user_profile module: {dir(user_profile)}")

except ImportError as e:
    print(f"❌ FAILED: Could not import 'user_profile'.")
    print(f"Error Details: {e}")
except Exception as e:
    print(f"❌ An unexpected error occurred: {e}")

print("\n--- Test Finished ---")