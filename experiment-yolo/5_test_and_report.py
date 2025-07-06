from ultralytics import YOLO
import json
import cv2

# --- Configurações ---
YOLO_MODEL_PATH = "runs/detect/train8/weights/best.pt"
STRIDE_DB_PATH = "stride_databases.json"
TEST_IMAGE = "diagrama.png"  # Coloque sua imagem aqui

# 1. Carrega o modelo YOLO treinado
model = YOLO(YOLO_MODEL_PATH)

# 2. Detecta componentes na imagem
results = model.predict(TEST_IMAGE, conf=0.3)  # conf = confiança mínima

# 3. Mostra a imagem com as detecções
detected_image = results[0].plot()  # Gera imagem com bounding boxes
cv2.imwrite("resultado_deteccao.jpg", detected_image)

# 4. Carrega o banco de ameaças
with open(STRIDE_DB_PATH) as f:
    threats_db = json.load(f)

# 5. Gera relatório de ameaças
relatorio = []
print('antes do for')
print(f"Total de detecções: {len(results[0].boxes)}")
results[0].show()
for box in results[0].boxes:
    print('entrou no for')
    class_id = int(box.cls)
    component_name = results[0].names[class_id]

    if component_name in threats_db:
        print('entrou no if')
        relatorio.append(f"\n--- {component_name} ---")
        for threat, solution in threats_db[component_name].items():
            relatorio.append(f"✅ **{threat}**: {solution}")
    else:
        relatorio.append(f"\n⚠️ {component_name} (não mapeado no JSON)")

# 6. Salva e mostra o relatório
with open("relatorio_local.txt", "w") as f:
    f.write("\n".join(relatorio))

print("✅ Resultados:")
print("\n".join(relatorio))
print("\n🎉 Imagem com detecções salva como 'resultado_deteccao.jpg'")