# Monocular 3D Reconstruction

**Single-View to 3D Scene in Under a Second -- Powered by Apple's SHARP Research**

---

## Why This Exists

Generating a full 3D scene from a single photograph has long been one of the hardest problems in computer vision. This project implements Apple's SHARP approach (Sharp Monocular View Synthesis), which produces photorealistic 3D Gaussian representations from a single 2D image in one feedforward pass -- no multi-view capture, no scanning, no waiting. It pairs the ML inference pipeline with a custom web-based 3D viewer built on SuperSplat for immediate interactive exploration of generated scenes.

## Architecture

```
Single 2D Image (any photograph)
        |
        v
+--------------------------------------------------+
|  SHARP Neural Network                             |
|                                                   |
|  Image Encoder --> Multi-Resolution Decoder       |
|       --> Monocular Depth Estimation              |
|       --> Gaussian Parameter Prediction (NDC)     |
|       --> Unproject to Metric 3D Space            |
|                                                   |
|  Single feedforward pass, < 1 second on GPU       |
+--------------------------------------------------+
        |
        v
3D Gaussian Splat (.ply) -- metric scale, absolute depth
        |
        +---> Web Viewer (Next.js + SuperSplat)
        |         - Interactive 3D exploration in browser
        |         - Upload image, view result immediately
        |
        +---> Video Rendering (gsplat, CUDA)
                  - Camera trajectory animation
                  - .mp4 output
```

### Key Capabilities

- **Sub-second 3D generation** from any single photograph via a single neural network forward pass
- **Metric-scale output** with absolute depth -- enables real-world camera movements
- **3DGS-compatible** (.ply format) works with any Gaussian Splat renderer
- **Interactive web viewer** for immediate 3D scene exploration in the browser
- **Multi-device inference** -- runs on CPU, CUDA, and Apple MPS (Metal)
- **Zero-shot generalization** across datasets, reducing LPIPS by 25-34% and DISTS by 21-43% vs. prior state of the art

## Tech Stack

| Layer | Technology |
|---|---|
| ML Framework | PyTorch |
| Model | Encoder-Decoder with Gaussian Head (SHARP) |
| 3D Representation | 3D Gaussian Splatting |
| CLI | Click |
| Web Viewer | Next.js (App Router), SuperSplat, Three.js |
| Video Rendering | gsplat (CUDA only) |
| Package Manager | pip, pyproject.toml |

## Quick Start

### ML Pipeline

```bash
# Create environment
conda create -n sharp python=3.13
conda activate sharp

# Install dependencies
pip install -r requirements.txt

# Run prediction (model downloads automatically on first run)
sharp predict -i /path/to/image.jpg -o /path/to/output/

# Render camera trajectory video (CUDA GPU required)
sharp predict -i /path/to/image.jpg -o /path/to/output/ --render
```

### Web Viewer

```bash
cd viewer
npm install
npm run dev
# Open http://localhost:3000
```

## Project Structure

```
monocular-3d-reconstruction/
  src/
    sharp/
      cli/
        predict.py               # Main prediction CLI
        render.py                # Camera trajectory video rendering
      models/
        encoders/                # Image feature encoders
        decoders/                # Multi-resolution convolutional decoders (UNet, etc.)
        gaussian_decoder.py      # 3D Gaussian parameter prediction
        predictor.py             # End-to-end RGB Gaussian predictor
        monodepth.py             # Monocular depth estimation module
        composer.py              # Model composition
        heads.py, blocks.py      # Neural network building blocks
      utils/                     # I/O, Gaussian ops, logging
  viewer/
    src/
      app/                       # Next.js App Router
        api/generate/route.ts    # Image-to-3D API endpoint
        api/ply/route.ts         # PLY file serving
      components/
        SuperSplatViewer.tsx      # SuperSplat-based 3D viewer
        GaussianSplatViewer.tsx   # Custom Gaussian Splat viewer
        EmbeddedViewer.tsx       # Embedded viewer wrapper
    public/supersplat/           # SuperSplat viewer assets
  supersplat-viewer-source/      # SuperSplat viewer source code
  data/                          # Sample images and teaser assets
```

### Research Reference

Based on: *Sharp Monocular View Synthesis in Less Than a Second* -- Mescheder, Dong, Li, Bai, Santos, Hu, Lecouat, Zhen, Delaunoy, Fang, Tsin, Richter, Koltun (Apple, 2025).

[arXiv:2512.10685](https://arxiv.org/abs/2512.10685) | [Project Page](https://apple.github.io/ml-sharp/)

---

Built by [Huang Akai (Kai)](https://github.com/akaihuang) -- Creative Technologist, Founder @ Universal FAW Labs
