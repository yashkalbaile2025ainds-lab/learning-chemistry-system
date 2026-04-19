import csv
import re
from collections import defaultdict
from pathlib import Path

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
DATA_DIR = Path(__file__).resolve().parent / "data"


def load_elements():
    elements = []
    atomic_masses = {}
    with (DATA_DIR / "elements.csv").open(newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            element = {
                "number": int(row["number"]),
                "symbol": row["symbol"],
                "name": row["name"],
                "category": row["category"],
                "atomicMass": float(row["atomic_mass"]),
            }
            elements.append(element)
            atomic_masses[element["symbol"]] = element["atomicMass"]
    return elements, atomic_masses


def load_formula_library():
    library = {}
    with (DATA_DIR / "formula_library.csv").open(newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            library[row["name"].strip().lower()] = row["formula"].strip()
    return library


def load_reactions():
    reactions = {}
    rows = []
    with (DATA_DIR / "reactions.csv").open(newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            reactant1 = row["reactant1"].strip()
            reactant2 = row["reactant2"].strip()
            result = row["result"].strip()
            reactions[(reactant1, reactant2)] = result
            rows.append({
                "reactant1": reactant1,
                "reactant2": reactant2,
                "result": result,
            })
    return reactions, rows


def load_ph_substances():
    with (DATA_DIR / "ph_substances.csv").open(newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        return [{"name": row["name"], "ph": float(row["ph"])} for row in reader]


def load_electrode_series():
    with (DATA_DIR / "electrode_series.csv").open(newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        return [
            {
                "title": row["title"],
                "tag": row["tag"],
                "reaction": row["reaction"],
                "potential": float(row["potential"]),
                "note": row["note"],
            }
            for row in reader
        ]


def load_stoich_reactions():
    grouped = defaultdict(lambda: {"id": "", "label": "", "reactants": [], "products": []})
    with (DATA_DIR / "stoich_reactions.csv").open(newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            reaction = grouped[row["id"]]
            reaction["id"] = row["id"]
            reaction["label"] = row["label"]
            target = reaction["reactants"] if row["role"] == "reactant" else reaction["products"]
            target.append({
                "formula": row["formula"],
                "coefficient": int(row["coefficient"]),
            })
    return list(grouped.values())


PERIODIC_ELEMENTS, ATOMIC_MASSES = load_elements()
FORMULA_LIBRARY = load_formula_library()
REACTIONS, REACTION_ROWS = load_reactions()
PH_SUBSTANCES = load_ph_substances()
ELECTRODE_SERIES = load_electrode_series()
STOICH_REACTIONS = load_stoich_reactions()


def parse_formula(formula: str):
    formula = formula.strip()
    if not formula or not re.fullmatch(r"(?:[A-Z][a-z]?\d*)+", formula):
        return None

    matches = re.findall(r"([A-Z][a-z]?)(\d*)", formula)
    composition = {}
    for symbol, count in matches:
        if symbol not in ATOMIC_MASSES:
            return None
        quantity = int(count) if count else 1
        if quantity <= 0:
            return None
        composition[symbol] = composition.get(symbol, 0) + quantity
    return composition


def calculate_molar_mass(formula: str):
    composition = parse_formula(formula)
    if composition is None:
        return None, None

    total_mass = 0.0
    breakdown = []
    for symbol, count in composition.items():
        atomic_mass = ATOMIC_MASSES[symbol]
        subtotal = atomic_mass * count
        total_mass += subtotal
        breakdown.append({
            "symbol": symbol,
            "count": count,
            "atomic_mass": atomic_mass,
            "subtotal": round(subtotal, 4),
        })

    return round(total_mass, 4), breakdown


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/periodic")
def periodic():
    return render_template("periodic.html")


@app.route("/tools")
def tools():
    return render_template("tools.html")


@app.route("/reactions")
def reactions():
    return render_template("reactions.html")


@app.route("/api/app_data")
def app_data():
    return jsonify({
        "periodic_elements": PERIODIC_ELEMENTS,
        "atomic_masses": ATOMIC_MASSES,
        "ph_substances": PH_SUBSTANCES,
        "electrode_series": ELECTRODE_SERIES,
        "stoich_reactions": STOICH_REACTIONS,
    })


@app.route("/api/find_formula", methods=["POST"])
def find_formula():
    data = request.get_json(silent=True) or {}
    compound_name = data.get("name", "").strip().lower()
    formula = FORMULA_LIBRARY.get(compound_name)

    if formula:
        return jsonify({"success": True, "formula": formula})
    return jsonify({"success": False, "message": "Compound not found in library."})


@app.route("/api/molar_mass", methods=["POST"])
def molar_mass():
    data = request.get_json(silent=True) or {}
    formula = data.get("formula", "").strip()

    mass, breakdown = calculate_molar_mass(formula)
    if mass is None:
        return jsonify({"success": False, "message": "Invalid or unsupported formula."})

    return jsonify({
        "success": True,
        "formula": formula,
        "molar_mass": mass,
        "breakdown": breakdown,
    })


@app.route("/api/reaction", methods=["POST"])
def reaction():
    data = request.get_json(silent=True) or {}
    r1 = data.get("reactant1", "").strip()
    r2 = data.get("reactant2", "").strip()

    if (r1, r2) in REACTIONS:
        return jsonify({"success": True, "result": REACTIONS[(r1, r2)]})
    if (r2, r1) in REACTIONS:
        return jsonify({"success": True, "result": REACTIONS[(r2, r1)]})

    return jsonify({
        "success": False,
        "message": "No predefined reaction found. Try H2 + O2, Na + Cl2, HCl + NaOH, Zn + HCl, etc.",
    })


if __name__ == '__main__':
   app.run(host="0.0.0.0", port=5000, debug=True)
