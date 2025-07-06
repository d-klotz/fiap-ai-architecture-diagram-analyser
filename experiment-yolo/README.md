# Threat Modeling Automation Project

## Project Description
This project automates the identification of security threats in AWS/Azure architecture diagrams using computer vision and the STRIDE methodology. The system detects cloud components in images and generates threat reports automatically.

## Project Structure

scientificProject/
├── data/                   # Raw input data and sample diagrams
├── dataset/                # Processed dataset
│   ├── config.yaml         # YOLO configuration file
│   └── processed_icons/    # Pre-processed component icons
├── models/                 # Trained model files
├── new_icons/              # Additional icons for expansion
├── runs/                   # Training and detection outputs
│   └── detect/
│       └── train/          # Contains trained model (best.pt)
├── notebooks/              # Jupyter notebooks for each step
│   ├── 1_labeling.ipynb    # Component labeling notebook
│   ├── 2_preprocessing.ipynb # Image preprocessing notebook
│   └── 3_training.ipynb    # Model training notebook
├── scripts/                # Python scripts
│   └── 5_test_and_report.py # Testing and reporting script
├── diagrama.png            # Sample architecture diagram
├── requirements.txt        # Python dependencies
├── README.md               # This documentation file
└── stride_databases.json   # Threat database (STRIDE mapping)

## Installation

1. Clone this repository:
git clone [repository-url]

2. Install dependencies:
pip install -r requirements.txt

## Usage

1. First, run the labeling notebook to create your component dataset:
jupyter notebook notebooks/1_labeling.ipynb

2. Preprocess your images:
jupyter notebook notebooks/2_preprocessing.ipynb

3. Train the YOLO model:
jupyter notebook notebooks/3_training.ipynb

4. Generate threat reports for diagrams:
python scripts/5_test_and_report.py --image diagrama.png

## Outputs

- Annotated images with detected components (in runs/detect/)
- Threat reports in text format (relatorio_local.txt)
- Trained model file (best.pt)

## Contributing

To add new components:
1. Place new icons in new_icons/
2. Update the stride_databases.json with new threats
3. Retrain the model
