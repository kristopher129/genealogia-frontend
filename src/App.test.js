// Use the test API from globalLibs to inject minimal d3/dTree/dSeeder shims.
const { __setTestLibraries, __resetTestLibraries } = require("./utils/globalLibs");
let seedMock;
const { render, screen, waitFor } = require("@testing-library/react");
const userEventModule = require("@testing-library/user-event");
const userEvent = userEventModule.default || userEventModule;
const horseFuncs = require("./utils/HorseFunctions");
const addHorse = horseFuncs.default || horseFuncs;
const addPartnerToHorse = horseFuncs.addPartnerToHorse;
const { familyTreeData } = require("./data/familyTreeData");
const App = require("./App").default || require("./App");

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // create a fresh seed mock and inject minimal shims
    seedMock = jest.fn((data) => data);
    const nodeStub = {
      node: () => ({}),
      empty: () => false,
      select: () => null,
      selectAll: () => ({ remove: () => {} }),
      attr: () => {},
      property: () => {},
    };
    // make select return the same stub so chained calls work
    nodeStub.select = () => nodeStub;
    const d3 = {
      select: () => nodeStub,
      zoomTransform: () => ({ k: 1, x: 0, y: 0, toString: () => "" }),
      zoomIdentity: { matrix: () => ({ toString: () => "" }) },
    };
    const dTree = { init: (seededData, opts) => ({ destroy: () => {}, resetZoom: () => {}, getTransform: () => null, setTransform: () => {} }) };
    const dSeeder = { seed: (data) => { seedMock(data); return data; } };
    __setTestLibraries({ d3, dTree, dSeeder });
  });

  afterEach(() => {
    __resetTestLibraries();
    jest.clearAllMocks();
  });


  test("muestra el caballo seleccionado por defecto", async () => {
    render(<App />);

    await screen.findByText(/caballo seleccionado:/i);
    expect(screen.getByText(/Niclas Superlongsurname/i)).toBeInTheDocument();
  });

  test("carga datos persistidos", async () => {
    const stored = [
      { id: 20, name: "Persistente", parent1Id: null, parent2Id: null, gender: "man", partners: [] },
      { id: 21, name: "Carolina", parent1Id: null, parent2Id: null, gender: "woman", partners: [20] },
    ];
    window.localStorage.setItem("genealogiaTreeData", JSON.stringify(stored));
    render(<App />);

  await waitFor(() => expect(seedMock).toHaveBeenCalled());
    const latestSeedCall = seedMock.mock.calls[seedMock.mock.calls.length - 1];
    const seededData = latestSeedCall[0];
    const persisted = seededData.find((member) => member.name === "Persistente");
    const persistedPartner = seededData.find((member) => member.name === "Carolina");
    expect(persisted).toBeTruthy();
    expect(persistedPartner).toBeTruthy();
    expect(persistedPartner.partners).toContain(persisted.id);
  });

  test("una nueva pareja queda enlazada y seleccionada", async () => {
  render(<App />);

  const agregarTab = await screen.findByRole("tab", { name: /agregar/i });
  await userEvent.click(agregarTab);
  const parejaButton = await screen.findByRole("button", { name: /pareja/i });
  await userEvent.click(parejaButton);
  const nameInput = screen.getByPlaceholderText("Nombre del nuevo caballo");
  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, "Camila");
    const initialCalls = seedMock.mock.calls.length;
  await userEvent.click(screen.getByRole("button", { name: /agregar/i }));

    await waitFor(() => expect(seedMock.mock.calls.length).toBeGreaterThan(initialCalls));
    const latestSeedCall = seedMock.mock.calls[seedMock.mock.calls.length - 1];
    const seededData = latestSeedCall[0];
    const createdPartner = seededData.find((member) => member.name === "Camila");
    const selectedHorse = seededData.find((member) => member.id === 0);
    expect(createdPartner).toBeTruthy();
    expect(createdPartner.gender).toBe("woman");
    expect(selectedHorse.partners).toContain(createdPartner.id);
    expect(createdPartner.partners).toContain(selectedHorse.id);
  // Nota: usamos una búsqueda con regex (en lugar de una cadena exacta)
  // porque la UI puede concatenar mensajes (p. ej. "Pareja agregada: Camila. Cría agregada automáticamente: ...").
  // Ver `.github/copilot-instructions.md` -> "Notas sobre tests — búsqueda de mensajes de UI" para
  // la explicación completa y recomendaciones sobre tests menos frágiles.
  await screen.findByText(/Pareja agregada:\s*Camila/i);
  await waitFor(() => expect(seedMock).toHaveBeenCalled());
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem("genealogiaTreeData"));
      const savedPartner = saved?.find((member) => member.name === "Camila");
      expect(savedPartner).toBeTruthy();
      expect(savedPartner.gender).toBe("woman");
    });
  });

  test("restablece el árbol a datos predeterminados", async () => {
    const initial = [
      { id: 90, name: "Extra", parent1Id: null, parent2Id: null, gender: "man", partners: [] },
    ];
    window.localStorage.setItem("genealogiaTreeData", JSON.stringify(initial));
  render(<App />);

    await waitFor(() => expect(seedMock).toHaveBeenCalled());
  const resetButton = await screen.findByRole("button", { name: /restablecer árbol/i });
  await userEvent.click(resetButton);
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem("genealogiaTreeData") || "[]");
      expect(saved.length).toBeGreaterThan(1);
      expect(saved.some((member) => member.name === "Extra")).toBe(false);
    });
  });

  test("rechaza pareja existente con género incompatible", async () => {
    const incompatibleData = [
      { id: 30, name: "Toro", parent1Id: null, parent2Id: null, gender: "man", partners: [] },
      { id: 31, name: "CaballoX", parent1Id: null, parent2Id: null, gender: "man", partners: [] },
    ];
    window.localStorage.setItem("genealogiaTreeData", JSON.stringify(incompatibleData));
  render(<App />);

  const agregarTab = await screen.findByRole("tab", { name: /agregar/i });
  await userEvent.click(agregarTab);
  const parejaButton = await screen.findByRole("button", { name: /pareja/i });
  await userEvent.click(parejaButton);
  const nameInput = screen.getByPlaceholderText("Nombre del nuevo caballo");
  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, "CaballoX");
  await userEvent.click(screen.getByRole("button", { name: /agregar/i }));

  // Nota: usamos una búsqueda menos estricta (regex) para mensajes de UI que pueden variar
  // (p. ej. por puntuación o texto adicional). Ver `.github/copilot-instructions.md` ->
  // "Notas sobre tests — búsqueda de mensajes de UI".
  await screen.findByText(/La pareja existente debe tener género opuesto/i);
  });
});

describe("Horse functions", () => {
  const cloneMembers = () => familyTreeData.map((member) => ({ ...member, partners: Array.isArray(member.partners) ? [...member.partners] : [] }));

  test("agrega un nuevo caballo con pareja vinculada", () => {
    const members = cloneMembers();
    const updated = addHorse(members, { name: "Nueva", gender: "woman", partners: [0] });
    expect(updated).toHaveLength(members.length + 1);
    const created = updated[updated.length - 1];
    expect(created.partners).toContain(0);
  });

  test("sincroniza pareja existente", () => {
    const members = cloneMembers();
    const updated = addPartnerToHorse(members, 4, 5);
    const horse = updated.find((member) => member.id === 4);
    const partner = updated.find((member) => member.id === 5);
    expect(horse.partners).toContain(5);
    expect(partner.partners).toContain(4);
  });
});
