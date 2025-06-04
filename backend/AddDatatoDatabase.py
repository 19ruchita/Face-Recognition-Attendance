import firebase_admin
from firebase_admin import credentials
from firebase_admin import db

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': "https://face-recognition-attenda-c4408-default-rtdb.firebaseio.com/"
})

ref = db.reference('Students')

data = {
    "321654":
        {
            "name": "Ruchita Raje",
            "major": "CSE",
            "starting_year": 2022,
            "total_attendance": 1,
            "standing": "A",
            "year": 3,
            "last_attendance_time": "2025-05-11 00:54:34"

        },
    "852741":
        {
            "name": "Anshika Khare",
            "major": "Economics",
            "starting_year": 2022,
            "total_attendance": 2,
            "standing": "A",
            "year": 3,
            "last_attendance_time": "2025-05-11 00:54:34"

        },
    "963852":
        {
            "name": "Elon",
            "major": "Physics",
            "starting_year": 2020,
            "total_attendance": 3,
            "standing": "B",
            "year": 5,
            "last_attendance_time": "2025-05-11 00:54:34"

        }
}

for key, value in data.items():
    ref.child(key).set(value)