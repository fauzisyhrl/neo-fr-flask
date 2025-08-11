from flask import Flask, render_template, request, jsonify
import requests
import uuid

app = Flask(__name__)

BASE_URL = "https://fr.neoapi.id/risetai/face-api/facegallery"

def gen_trx():
    return str(uuid.uuid4()).replace("-", "")[:12]

def api_post(url_suffix, token, data):
    headers = {
        "Accesstoken": token,
        "Content-Type": "application/json"
    }
    data["trx_id"] = gen_trx()
    url = f"{BASE_URL}/{url_suffix}"
    return requests.post(url, json=data, headers=headers).json()

def api_delete(url_suffix, token, data):
    headers = {
        "Accesstoken": token,
        "Content-Type": "application/json"
    }
    data["trx_id"] = gen_trx()
    url = f"{BASE_URL}/{url_suffix}"
    return requests.delete(url, json=data, headers=headers).json()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/create_gallery", methods=["POST"])
def create_gallery():
    d = request.json
    return api_post("create-facegallery", d["token"], {
        "facegallery_id": d["gallery_name"]
    })

@app.route("/delete_gallery", methods=["POST"])
def delete_gallery():
    d = request.json
    return api_delete("delete-facegallery", d["token"], {
        "facegallery_id": d["gallery_name"]
    })

@app.route("/list_galleries", methods=["POST"])
def list_galleries():
    d = request.json
    headers = {
        "Accesstoken": d["token"]
    }
    url = f"{BASE_URL}/my-facegalleries"
    r = requests.get(url, headers=headers)
    return r.json()

@app.route("/enroll_face", methods=["POST"])
def enroll_face():
    d = request.json
    return api_post("enroll-face", d["token"], {
        "user_id": d["person_name"],
        "user_name": d["person_display_name"],
        "facegallery_id": d["gallery_name"],
        "image": d["image_base64"]
    })

# Python Flask (server kamu)
@app.route("/list_faces", methods=["POST"])
def list_faces():
    data = request.get_json()
    token = data["token"]
    gallery_id = data["gallery_name"]
    trx_id = data.get("trx_id", str(uuid.uuid4()))

    url = "https://fr.neoapi.id/risetai/face-api/facegallery/list-faces"
    headers = {
        "Accesstoken": token,
        "Content-Type": "application/json"
    }
    payload = {
        "facegallery_id": gallery_id,
        "trx_id": trx_id
    }

    response = requests.request("GET", url, headers=headers, json=payload)
    return jsonify(response.json())



@app.route("/delete_face", methods=["POST"])
def delete_face():
    d = request.json
    return api_delete("delete-face", d["token"], {
        "user_id": d["person_name"],
        "facegallery_id": d["gallery_name"]
    })

@app.route("/verify_face", methods=["POST"])
def verify_face():
    d = request.json
    return api_post("verify-face", d["token"], {
        "user_id": d["person_name"],
        "facegallery_id": d["gallery_name"],
        "image": d["image_base64"]
    })

@app.route("/identify_face", methods=["POST"])
def identify_face():
    d = request.json
    return api_post("identify-face", d["token"], {
        "facegallery_id": d["gallery_name"],
        "image": d["image_base64"]
    })

if __name__ == "__main__":
    app.run(debug=True)


