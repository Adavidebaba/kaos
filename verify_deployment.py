from fastapi.testclient import TestClient
from backend.main import app
import os
import shutil

# Setup Test Client
client = TestClient(app)

def test_workflow():
    print("🚀 Starting Kaos 2.0 Verification...")

    # 1. Clean Slate
    if os.path.exists("data/magazzino.db"):
        os.remove("data/magazzino.db")
    # Re-init DB by importing models (happens in main, but we force it here implicitly by client start)
    
    # 2. Create Location (Box 100)
    print("Testing Location Creation...")
    res = client.post("/locations/", json={"name": "Box 100", "id": 100})
    assert res.status_code == 200
    assert res.json()["id"] == 100
    print("✅ Location Created: Box 100")

    # 3. Create Location (Box 101)
    res = client.post("/locations/", json={"name": "Box 101", "id": 101})
    assert res.status_code == 200
    print("✅ Location Created: Box 101")

    # 4. Upload Item to Box 100
    print("Testing Item Upload...")
    # Create a dummy image
    from PIL import Image
    img = Image.new('RGB', (100, 100), color = 'red')
    img.save("test.jpg")
    
    with open("test.jpg", "rb") as f:
        res = client.post(
            "/items/", 
            data={"location_id": 100, "description": "Red Cube"},
            files={"file": ("test.jpg", f, "image/jpeg")}
        )
    assert res.status_code == 200
    item_id = res.json()["id"]
    print(f"✅ Item Uploaded: ID {item_id} in Box 100")

    # 5. Verify Item is in Box 100
    res = client.get(f"/locations/100")
    # Note: Our API doesn't return items in location detail by default unless eager loaded, 
    # but let's check item directly
    # Actually, let's check items list
    res = client.get("/items/")
    item = next(i for i in res.json() if i["id"] == item_id)
    assert item["location_id"] == 100
    print("✅ Item Verification: Confirmed in Box 100")

    # 6. Bulk Move (Pocket Logic) -> Move to Box 101
    print("Testing Bulk Move...")
    res = client.post("/items/bulk-update", json={
        "item_ids": [item_id],
        "location_id": 101
    })
    assert res.status_code == 200
    updated_item = res.json()[0]
    assert updated_item["location_id"] == 101
    print("✅ Bulk Move: Item moved to Box 101")

    # Cleanup
    if os.path.exists("test.jpg"):
        os.remove("test.jpg")
    
    print("🎉 All Tests Passed! Backend is solid.")

if __name__ == "__main__":
    try:
        test_workflow()
    except AssertionError as e:
        print(f"❌ Test Failed: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
