# Gunakan image Python resmi
FROM python:3.11-slim

# Atur direktori kerja
WORKDIR /app

# Salin file ke container
COPY . /app

# Install dependensi
RUN pip install --no-cache-dir -r requirements.txt

# Expose port Flask
EXPOSE 5000

# Jalankan aplikasi menggunakan gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000", "--workers", "2"]
