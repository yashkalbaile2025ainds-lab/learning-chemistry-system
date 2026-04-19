let PERIODIC_ELEMENTS = [];
let ATOMIC_MASSES = {};
let PH_SUBSTANCES = [];
let ELECTRODE_SERIES = [];
let STOICH_REACTIONS = [];

const CATEGORY_LABELS = {
    alkali: "Alkali metal",
    alkaline: "Alkaline earth metal",
    transition: "Transition metal",
    post: "Post-transition metal",
    metalloid: "Metalloid",
    nonmetal: "Nonmetal",
    halogen: "Halogen",
    noble: "Noble gas",
    lanthanide: "Lanthanide",
    actinide: "Actinide",
    unknown: "Unknown"
};

const ELEMENT_FACTS = {
    H: "Hydrogen is the lightest element and the most abundant chemical element in the observable universe.",
    He: "Helium is a noble gas with extremely low reactivity and a very low boiling point.",
    C: "Carbon forms the backbone of organic chemistry and appears in structures from diamond to graphene.",
    N: "Nitrogen makes up most of Earth's atmosphere and is essential to proteins, DNA, and plant growth.",
    O: "Oxygen supports respiration and combustion and is one of the most abundant elements in Earth's crust.",
    Si: "Silicon is central to semiconductors, glass, and many minerals found in the Earth's crust.",
    Fe: "Iron is a strong structural metal and a key part of steel, machinery, and biological oxygen transport.",
    Cu: "Copper is highly conductive and widely used in wiring, electronics, motors, and plumbing.",
    Ag: "Silver is valued for its high conductivity, reflectivity, and long history in jewelry and coins.",
    Au: "Gold is dense, corrosion-resistant, and widely used in electronics, finance, and ornamentation.",
    U: "Uranium is a heavy actinide element known for its role in nuclear power and radioactivity."
};

const MAIN_TABLE_LAYOUT = [
    ["H", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "He"],
    ["Li", "Be", null, null, null, null, null, null, null, null, null, null, "B", "C", "N", "O", "F", "Ne"],
    ["Na", "Mg", null, null, null, null, null, null, null, null, null, null, "Al", "Si", "P", "S", "Cl", "Ar"],
    ["K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr"],
    ["Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe"],
    ["Cs", "Ba", "La", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn"],
    ["Fr", "Ra", "Ac", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"]
];

const LANTHANIDE_LAYOUT = ["Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu"];
const ACTINIDE_LAYOUT = ["Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr"];

document.addEventListener("DOMContentLoaded", async () => {
    await loadAppData();
    initPeriodicTable();
    initChemTools();
});

async function loadAppData() {
    try {
        const response = await fetch("/api/app_data");
        const data = await response.json();
        PERIODIC_ELEMENTS = data.periodic_elements || [];
        ATOMIC_MASSES = data.atomic_masses || {};
        PH_SUBSTANCES = data.ph_substances || [];
        ELECTRODE_SERIES = data.electrode_series || [];
        STOICH_REACTIONS = data.stoich_reactions || [];
    } catch (error) {
        console.error("Failed to load app data", error);
    }
}

function initPeriodicTable() {
    const table = document.getElementById("periodicTable");
    const legend = document.getElementById("legend");
    const searchInput = document.getElementById("elementSearch");

    if (!table || !legend || !searchInput || PERIODIC_ELEMENTS.length === 0) {
        return;
    }

    renderLegend(legend);
    renderPeriodicTable(table, PERIODIC_ELEMENTS);

    searchInput.addEventListener("input", () => {
        const value = searchInput.value.trim().toLowerCase();
        const cards = table.querySelectorAll(".searchable-card");

        cards.forEach((card) => {
            const matches = [card.dataset.name, card.dataset.symbol, card.dataset.category]
                .some((field) => field.includes(value));
            card.classList.toggle("hidden-card", !matches);
        });
    });
}

function renderLegend(legend) {
    legend.innerHTML = Object.entries(CATEGORY_LABELS)
        .filter(([category]) => category !== "unknown")
        .map(([category, label]) => `<span class="legend-item category-${category}">${label}</span>`)
        .join("");
}

function renderPeriodicTable(container, elements) {
    const elementMap = new Map(elements.map((element) => [element.symbol, element]));
    const mainMarkup = MAIN_TABLE_LAYOUT.map((row, rowIndex) => (
        row.map((symbol, columnIndex) => renderMainCell(elementMap.get(symbol), rowIndex + 1, columnIndex + 1)).join("")
    )).join("");
    const lanthanidesMarkup = LANTHANIDE_LAYOUT.map((symbol) => renderSeriesCell(elementMap.get(symbol))).join("");
    const actinidesMarkup = ACTINIDE_LAYOUT.map((symbol) => renderSeriesCell(elementMap.get(symbol))).join("");

    container.innerHTML = `
        <div class="periodic-main">${mainMarkup}</div>
        <div class="periodic-series">
            <div class="series-row">${lanthanidesMarkup}</div>
            <div class="series-row">${actinidesMarkup}</div>
        </div>
    `;
}

function renderMainCell(element, row, column) {
    if (!element) {
        return `<div class="element-slot" style="grid-row:${row};grid-column:${column};"></div>`;
    }
    return renderElementCard(element, row, column);
}

function renderSeriesCell(element) {
    if (!element) {
        return "<div class=\"series-slot\"></div>";
    }
    return renderElementCard(element);
}

function renderElementCard(element, row, column) {
    const style = row && column ? ` style="grid-row:${row};grid-column:${column};"` : "";
    const categoryLabel = CATEGORY_LABELS[element.category] || CATEGORY_LABELS.unknown;

    return (
        `<button class="element searchable-card category-${element.category}"${style} ` +
        `type="button" data-name="${element.name.toLowerCase()}" ` +
        `data-symbol="${element.symbol.toLowerCase()}" ` +
        `data-category="${categoryLabel.toLowerCase()}" ` +
        `onclick="showElement(${element.number})">` +
        `<span class="num">${element.number}</span>` +
        `<span class="sym">${element.symbol}</span>` +
        `<span class="name">${element.name}</span>` +
        `</button>`
    );
}

function showElement(number) {
    const element = PERIODIC_ELEMENTS.find((entry) => entry.number === number);
    const box = document.getElementById("elementInfo");

    if (!element || !box) {
        return;
    }

    box.innerHTML = `
        <h3>${element.name} (${element.symbol})</h3>
        <p><strong>Atomic number:</strong> ${element.number}</p>
        <p><strong>Category:</strong> ${CATEGORY_LABELS[element.category]}</p>
        <p><strong>Atomic mass:</strong> ${element.atomicMass}</p>
    `;

    openElementModal(element);
}

function openElementModal(element) {
    const modal = document.getElementById("elementModal");
    const content = document.getElementById("elementModalContent");
    if (!modal || !content) {
        return;
    }

    const shells = getShellDistribution(element.number);
    const period = getElementPeriod(element.symbol);
    const group = getElementGroup(element.symbol);
    const phase = getElementPhase(element.symbol);
    const block = getElementBlock(group, element.category);
    const summary = getElementSummary(element, period, group, phase);

    content.innerHTML = `
        <div class="flashcard-header">
            <div>
                <span class="flashcard-tag">${CATEGORY_LABELS[element.category]}</span>
                <h2>${element.name}</h2>
            </div>
            <div class="flashcard-badge category-${element.category}">
                <span>${element.number}</span>
                <strong>${element.symbol}</strong>
            </div>
        </div>
        <div class="bohr-stage">
            <div class="bohr-model">
                <div class="bohr-nucleus category-${element.category}">
                    <span>${element.symbol}</span>
                </div>
                ${renderShells(shells)}
            </div>
            <p class="bohr-caption">Animated atomic structure</p>
        </div>
        <div class="flashcard-copy">
            <p class="flashcard-description">${summary}</p>
            <p><strong>Atomic number:</strong> ${element.number}</p>
            <p><strong>Symbol:</strong> ${element.symbol}</p>
            <p><strong>Atomic mass:</strong> ${element.atomicMass} u</p>
            <p><strong>Category:</strong> ${CATEGORY_LABELS[element.category]}</p>
            <p><strong>Period:</strong> ${period}</p>
            <p><strong>Group:</strong> ${group}</p>
            <p><strong>Block:</strong> ${block}</p>
            <p><strong>Phase at room temperature:</strong> ${phase}</p>
            <p><strong>Electron shells:</strong> ${shells.join(", ")}</p>
        </div>
    `;

    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
}

function closeElementModal() {
    const modal = document.getElementById("elementModal");
    if (!modal) {
        return;
    }
    modal.classList.add("hidden");
    document.body.classList.remove("modal-open");
}

function getElementSummary(element, period, group, phase) {
    return ELEMENT_FACTS[element.symbol] || `${element.name} is a ${CATEGORY_LABELS[element.category].toLowerCase()} in period ${period}, group ${group}, and is usually observed as a ${phase.toLowerCase()} at room temperature.`;
}

function getElementPeriod(symbol) {
    const rowIndex = MAIN_TABLE_LAYOUT.findIndex((row) => row.includes(symbol));
    if (rowIndex >= 0) {
        return rowIndex + 1;
    }
    if (LANTHANIDE_LAYOUT.includes(symbol)) {
        return 6;
    }
    if (ACTINIDE_LAYOUT.includes(symbol)) {
        return 7;
    }
    return "-";
}

function getElementGroup(symbol) {
    for (const row of MAIN_TABLE_LAYOUT) {
        const columnIndex = row.indexOf(symbol);
        if (columnIndex >= 0) {
            return columnIndex + 1;
        }
    }
    if (LANTHANIDE_LAYOUT.includes(symbol) || ACTINIDE_LAYOUT.includes(symbol)) {
        return 3;
    }
    return "-";
}

function getElementPhase(symbol) {
    const gases = new Set(["H", "He", "N", "O", "F", "Ne", "Cl", "Ar", "Kr", "Xe", "Rn", "Og"]);
    const liquids = new Set(["Br", "Hg"]);
    if (gases.has(symbol)) {
        return "Gas";
    }
    if (liquids.has(symbol)) {
        return "Liquid";
    }
    return "Solid";
}

function getElementBlock(group, category) {
    if (category === "lanthanide" || category === "actinide") {
        return "f-block";
    }
    if (group >= 13 && group <= 18) {
        return "p-block";
    }
    if (group >= 3 && group <= 12) {
        return "d-block";
    }
    return "s-block";
}

function getShellDistribution(atomicNumber) {
    const shellCapacities = [2, 8, 18, 32, 32, 18, 8];
    const shells = [];
    let remaining = atomicNumber;

    for (const capacity of shellCapacities) {
        if (remaining <= 0) {
            break;
        }
        const electrons = Math.min(remaining, capacity);
        shells.push(electrons);
        remaining -= electrons;
    }

    return shells;
}

function renderShells(shells) {
    return shells.map((count, shellIndex) => {
        const size = 90 + (shellIndex * 46);
        const duration = 10 + (shellIndex * 4);
        const electrons = Array.from({ length: count }, (_, index) => {
            const angle = (360 / count) * index;
            return `
                <span class="orbit" style="animation-duration:${duration}s;">
                    <span class="electron-anchor" style="transform: rotate(${angle}deg);">
                        <span class="electron" style="transform: translateX(${size / 2}px);"></span>
                    </span>
                </span>
            `;
        }).join("");

        return `
            <div class="shell" style="width:${size}px;height:${size}px;">
                ${electrons}
            </div>
        `;
    }).join("");
}

function initChemTools() {
    updatePhInputLabel();
    renderPhScale(7);
    renderCommonSubstances();
    renderElectrodeCards();
    renderStoichOptions();
}

function switchToolTab(tabName, button) {
    document.querySelectorAll("[data-tool-panel]").forEach((panel) => {
        panel.classList.toggle("hidden", panel.dataset.toolPanel !== tabName);
    });
    document.querySelectorAll("[data-tool-tab]").forEach((tab) => {
        tab.classList.toggle("is-active", tab === button);
    });
}

function updatePhInputLabel() {
    const mode = document.getElementById("phMode");
    const label = document.getElementById("phInputLabel");
    if (!mode || !label) {
        return;
    }
    const labels = {
        ph: "Enter pH value",
        poh: "Enter pOH value",
        h: "Enter [H+] mol/L",
        oh: "Enter [OH-] mol/L"
    };
    label.textContent = labels[mode.value];
}

function calculatePh(valueOverride) {
    const modeEl = document.getElementById("phMode");
    const inputEl = document.getElementById("phValue");
    if (!modeEl || !inputEl) {
        return;
    }

    const mode = valueOverride !== undefined ? "ph" : modeEl.value;
    const rawValue = valueOverride ?? Number.parseFloat(inputEl.value);
    if (!Number.isFinite(rawValue)) {
        return;
    }

    let ph;
    if (mode === "ph") {
        ph = rawValue;
    } else if (mode === "poh") {
        ph = 14 - rawValue;
    } else if (mode === "h") {
        ph = -Math.log10(rawValue);
    } else {
        ph = 14 + Math.log10(rawValue);
    }

    ph = Math.max(0, Math.min(14, ph));
    const poh = 14 - ph;
    const h = 10 ** (-ph);
    const oh = 10 ** (-poh);
    const descriptor = getPhDescriptor(ph);

    document.getElementById("phReading").textContent = ph.toFixed(2);
    document.getElementById("phClassification").textContent = descriptor.label;
    document.getElementById("phExample").textContent = descriptor.example;
    document.getElementById("phResult").textContent = ph.toFixed(4);
    document.getElementById("pohResult").textContent = poh.toFixed(4);
    document.getElementById("hResult").textContent = formatScientific(h);
    document.getElementById("ohResult").textContent = formatScientific(oh);
    renderPhScale(ph);

    if (valueOverride !== undefined) {
        modeEl.value = "ph";
        inputEl.value = ph.toFixed(2);
        updatePhInputLabel();
    }
}

function getPhDescriptor(ph) {
    if (ph < 3) {
        return { label: "Strongly Acidic", example: "Lemon juice" };
    }
    if (ph < 6) {
        return { label: "Acidic", example: "Coffee or tomato juice" };
    }
    if (ph < 8) {
        return { label: "Near Neutral", example: "Pure water" };
    }
    if (ph < 11) {
        return { label: "Basic", example: "Baking soda solution" };
    }
    return { label: "Strongly Basic", example: "Ammonia or bleach" };
}

function renderPhScale(activePh) {
    const scale = document.getElementById("phScale");
    if (!scale) {
        return;
    }
    const colors = ["#ff150b", "#ff4a0d", "#ff7f11", "#ffa31a", "#ffc81d", "#d5dd00", "#8bd400", "#32cc35", "#05b267", "#1179ad", "#104c8a", "#0b2f69", "#07084c", "#02022b", "#010116"];
    const markerPosition = (activePh / 14) * 100;

    scale.innerHTML = `
        <div class="ph-scale-track">
            ${colors.map((color, index) => `<span class="ph-segment" style="background:${color};">${index}</span>`).join("")}
            <span class="ph-marker" style="left:${markerPosition}%;"></span>
        </div>
    `;
}

function renderCommonSubstances() {
    const container = document.getElementById("commonSubstances");
    if (!container) {
        return;
    }
    container.innerHTML = PH_SUBSTANCES.map((item) => `
        <button type="button" class="substance-chip" onclick="calculatePh(${item.ph})">
            <span>${item.name}</span>
            <strong>pH ${item.ph}</strong>
        </button>
    `).join("");
}

function renderElectrodeCards() {
    const grid = document.getElementById("electrodeGrid");
    if (!grid) {
        return;
    }
    grid.innerHTML = ELECTRODE_SERIES.map((item) => `
        <article class="glass electrode-card">
            <h3>${item.title}</h3>
            <p class="electrode-tag">${item.tag}</p>
            <p class="electrode-reaction">${item.reaction}</p>
            <div class="electrode-potential ${item.potential >= 0 ? "positive" : "negative"}">${item.potential >= 0 ? "+" : ""}${item.potential.toFixed(2)} V</div>
            <div class="electrode-bar">
                <span style="width:${Math.min(100, ((item.potential + 0.5) / 3.5) * 100)}%;"></span>
            </div>
            <p class="electrode-note">${item.note}</p>
        </article>
    `).join("");
}

function renderStoichOptions() {
    const select = document.getElementById("stoichReaction");
    if (!select) {
        return;
    }
    select.innerHTML = STOICH_REACTIONS.map((reaction) => `<option value="${reaction.id}">${reaction.label}</option>`).join("");
    renderStoichReaction();
}

function renderStoichReaction() {
    const reaction = getSelectedReaction();
    const preview = document.getElementById("stoichReactionPreview");
    const inputs = document.getElementById("stoichInputs");
    const results = document.getElementById("stoichResults");
    if (!reaction || !preview || !inputs || !results) {
        return;
    }

    preview.textContent = reaction.label;
    inputs.innerHTML = reaction.reactants.map((reactant) => `
        <label class="lab-field">
            <span>Mass of ${reactant.formula} (g)</span>
            <input type="number" step="any" class="input input-dark" data-stoich-formula="${reactant.formula}" placeholder="Enter grams">
        </label>
    `).join("");
    results.innerHTML = "";
}

function calculateStoichiometry() {
    const reaction = getSelectedReaction();
    const results = document.getElementById("stoichResults");
    if (!reaction || !results) {
        return;
    }

    const reactantData = reaction.reactants.map((reactant) => {
        const input = document.querySelector(`[data-stoich-formula="${reactant.formula}"]`);
        const grams = input ? Number.parseFloat(input.value) : NaN;
        const molarMass = getMolarMassValue(reactant.formula);
        const moles = Number.isFinite(grams) && grams > 0 ? grams / molarMass : 0;
        return { ...reactant, grams, molarMass, moles };
    });

    const validReactants = reactantData.filter((item) => item.moles > 0);
    if (validReactants.length === 0) {
        results.innerHTML = "<div class=\"metric-card\"><strong>Enter at least one reactant mass to calculate stoichiometry.</strong></div>";
        return;
    }

    const limitingRatio = Math.min(...validReactants.map((item) => item.moles / item.coefficient));
    const reactantCards = reactantData.map((item) => {
        const usedMoles = limitingRatio * item.coefficient;
        const usedMass = usedMoles * item.molarMass;
        return `
            <div class="metric-card">
                <span>${item.formula} used</span>
                <strong>${usedMass.toFixed(4)} g</strong>
            </div>
        `;
    }).join("");

    const productCards = reaction.products.map((product) => {
        const producedMoles = limitingRatio * product.coefficient;
        const molarMass = getMolarMassValue(product.formula);
        const producedMass = producedMoles * molarMass;
        return `
            <div class="metric-card">
                <span>${product.formula} produced</span>
                <strong>${producedMass.toFixed(4)} g</strong>
            </div>
        `;
    }).join("");

    results.innerHTML = `
        <div class="metric-card">
            <span>Limiting ratio</span>
            <strong>${limitingRatio.toFixed(4)} mol reaction units</strong>
        </div>
        ${reactantCards}
        ${productCards}
    `;
}

function getSelectedReaction() {
    const select = document.getElementById("stoichReaction");
    return STOICH_REACTIONS.find((reaction) => reaction.id === (select ? select.value : ""));
}

function getMolarMassValue(formula) {
    const composition = parseFormulaClient(formula);
    return Object.entries(composition).reduce((total, [symbol, count]) => total + (ATOMIC_MASSES[symbol] * count), 0);
}

function parseFormulaClient(formula) {
    const matches = formula.match(/([A-Z][a-z]?)(\d*)/g) || [];
    const composition = {};
    matches.forEach((token) => {
        const [, symbol, count] = token.match(/([A-Z][a-z]?)(\d*)/);
        composition[symbol] = (composition[symbol] || 0) + (count ? Number.parseInt(count, 10) : 1);
    });
    return composition;
}

function formatScientific(value) {
    const exponentString = value.toExponential(2);
    const [mantissa, exponent] = exponentString.split("e");
    return `${mantissa} x 10^${Number.parseInt(exponent, 10)} mol/L`;
}

async function findFormula() {
    const input = document.getElementById("compoundName");
    const resultBox = document.getElementById("formulaResult");
    const compoundName = input ? input.value.trim() : "";

    if (!resultBox) {
        return;
    }

    if (!compoundName) {
        resultBox.innerHTML = "<p>Please enter a compound name.</p>";
        return;
    }

    resultBox.innerHTML = "<p>Looking up formula...</p>";

    try {
        const response = await fetch("/api/find_formula", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: compoundName })
        });
        const data = await response.json();

        resultBox.innerHTML = data.success
            ? `<h3>${compoundName}</h3><p><strong>Formula:</strong> ${data.formula}</p>`
            : `<p>${data.message}</p>`;
    } catch (error) {
        resultBox.innerHTML = "<p>Something went wrong while finding the formula.</p>";
    }
}

async function calculateMass() {
    const input = document.getElementById("formulaInput");
    const resultBox = document.getElementById("massResult");
    const formula = input ? input.value.trim() : "";

    if (!resultBox) {
        return;
    }

    if (!formula) {
        resultBox.innerHTML = "<p>Please enter a chemical formula.</p>";
        return;
    }

    resultBox.innerHTML = "<p>Calculating molar mass...</p>";

    try {
        const response = await fetch("/api/molar_mass", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ formula })
        });
        const data = await response.json();

        if (!data.success) {
            resultBox.innerHTML = `<p>${data.message}</p>`;
            return;
        }

        const rows = data.breakdown.map((item) => (
            `<li>${item.symbol}: ${item.count} x ${item.atomic_mass} = ${item.subtotal}</li>`
        )).join("");

        resultBox.innerHTML = `
            <h3>${data.formula}</h3>
            <p><strong>Molar mass:</strong> ${data.molar_mass} g/mol</p>
            <ul>${rows}</ul>
        `;
    } catch (error) {
        resultBox.innerHTML = "<p>Something went wrong while calculating the molar mass.</p>";
    }
}

async function checkReaction() {
    const reactant1Input = document.getElementById("reactant1");
    const reactant2Input = document.getElementById("reactant2");
    const resultBox = document.getElementById("reactionResult");
    const reactant1 = reactant1Input ? reactant1Input.value.trim() : "";
    const reactant2 = reactant2Input ? reactant2Input.value.trim() : "";

    if (!resultBox) {
        return;
    }

    if (!reactant1 || !reactant2) {
        resultBox.innerHTML = `
            <h3>Reaction Output</h3>
            <p>Please enter both reactants.</p>
        `;
        return;
    }

    resultBox.innerHTML = `
        <h3>Reaction Output</h3>
        <p>Checking reaction...</p>
    `;

    try {
        const response = await fetch("/api/reaction", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                reactant1,
                reactant2
            })
        });

        const data = await response.json();

        resultBox.innerHTML = data.success
            ? `
                <h3>Reaction Output</h3>
                <p><strong>Reactants:</strong> ${reactant1} + ${reactant2}</p>
                <p><strong>Result:</strong> ${data.result}</p>
            `
            : `
                <h3>Reaction Output</h3>
                <p>${data.message}</p>
            `;
    } catch (error) {
        resultBox.innerHTML = `
            <h3>Reaction Output</h3>
            <p>Something went wrong while checking the reaction.</p>
        `;
    }
}
