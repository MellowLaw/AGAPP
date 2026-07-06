# ML Dataset Citations & Licenses (pothole model)

> **Purpose:** attribution + license record for the datasets used to train the AGAPP
> pothole detector. **Keep this — RSDD is CC BY 4.0, which legally requires attribution.**
> Copy the relevant entries into the manuscript's References + a "Datasets" acknowledgment.
> **Recorded:** 2026-07-05 (from each dataset's exported `data.yaml`).

---

## 1. RSDD — Road Surface Damage Detection  ⚠️ ATTRIBUTION REQUIRED
- **Used for:** pothole class (index 3 of 4) — the other 3 classes (crocodile / lateral /
  longitudinal crack) are dropped for AGAPP's single-class pothole model.
- **License:** **CC BY 4.0** (per `RSDD.v6i.yolov8/data.yaml`). Attribution is a
  license condition — you must credit it.
- **Roboflow Universe:** https://universe.roboflow.com/rdd/rsdd (workspace `rdd`, project `rsdd`, version 6)
- **Derives from:** RDD2020 (Arya et al. 2021) — RSDD relabelled a large portion of RDD2020
  into 4 severity categories. Cite both.

**Source paper (cite this):**
```bibtex
@article{Salcedo2022rsdd,
  title   = {A Novel Road Maintenance Prioritisation System Based on Computer Vision and Crowdsourced Reporting},
  author  = {Salcedo, Edwin and Jaber, Mona and Requena Carri{\'o}n, Jes{\'u}s},
  journal = {Journal of Sensor and Actuator Networks},
  volume  = {11}, number = {1}, pages = {15}, year = {2022},
  doi     = {10.3390/jsan11010015}
}
```

**Dataset (cite this):**
```bibtex
@misc{rsdd_dataset,
  title        = {RSDD Dataset},
  author       = {RDD (Roboflow workspace)},
  howpublished = {\url{https://universe.roboflow.com/rdd/rsdd}},
  note         = {Roboflow Universe, version 6, CC BY 4.0, visited 2026-07-05}
}
```

## 2. New Pothole Detection (Smartathon)  — Public Domain (cite for integrity)
- **Used for:** pothole class (single class, index 0) — used as-is.
- **License:** **Public Domain / CC0 1.0** (per `New pothole detection.v2i.yolov8/data.yaml`).
  No attribution legally required — but cite it anyway.
- **Roboflow Universe:** https://universe.roboflow.com/smartathon/new-pothole-detection (version 2)

```bibtex
@misc{new_pothole_detection_dataset,
  title        = {New Pothole Detection Dataset},
  type         = {Open Source Dataset},
  author       = {Smartathon},
  howpublished = {\url{https://universe.roboflow.com/smartathon/new-pothole-detection}},
  journal      = {Roboflow Universe}, publisher = {Roboflow},
  year         = {2023}, month = {jan}, note = {CC0 1.0 Public Domain, visited 2026-07-05}
}
```

## 3. RDD2020 — the upstream benchmark (cite; RSDD derives from it)
```bibtex
@article{Arya2021rdd2020,
  title   = {RDD2020: An Annotated Image Dataset for Automatic Road Damage Detection Using Deep Learning},
  author  = {Arya, Deeksha and Maeda, Hiroya and Ghosh, Sanjay Kumar and Toshniwal, Durga and Sekimoto, Yoshihide},
  journal = {Data in Brief}, volume = {36}, pages = {107133}, year = {2021},
  doi     = {10.1016/j.dib.2021.107133}
}
```

## 4. Model / tooling (mention in Methodology)
- **YOLOv8** — Ultralytics (AGPL-3.0). Cite the Ultralytics YOLOv8 repo/release.
- **Roboflow** — dataset hosting/export (and optional hosted inference).
- **Stray-pets detector** — COCO-pretrained YOLOv8n (`yolov8n.pt`); cite COCO
  (Lin et al. 2014) if you use the pretrained dog/cat classes.

---

### Suggested one-liner for the manuscript's Datasets section
> "The pothole detector was trained on two publicly licensed road-damage datasets
> obtained via Roboflow Universe: **RSDD** (Salcedo et al., 2022; CC BY 4.0), from which
> only the *pothole* class was retained, and the **New Pothole Detection** dataset
> (Smartathon, 2023; CC0 1.0). RSDD relabels a portion of **RDD2020** (Arya et al., 2021).
> No locally captured Philippine imagery was used; generalisation to local road
> conditions is noted as a limitation and directed to future work."
