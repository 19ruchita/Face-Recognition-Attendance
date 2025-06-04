import face_recognition
import os
import pickle

path = 'Images'  # your folder name

encodeList = []
classNames = []

for filename in os.listdir(path):
    if filename.endswith(('.jpg', '.png')):
        img_path = os.path.join(path, filename)
        img = face_recognition.load_image_file(img_path)
        encodings = face_recognition.face_encodings(img)
        if encodings:
            encodeList.append(encodings[0])
            classNames.append(os.path.splitext(filename)[0])  # filename without extension as ID/name

with open('encodefile.p', 'wb') as f:
    pickle.dump([encodeList, classNames], f)

print("encodefile.p generated successfully!")
