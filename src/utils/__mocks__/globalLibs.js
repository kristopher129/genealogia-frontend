// Manual Jest mock for utils/globalLibs
// Exports small set of jest.fn() so tests can inspect calls.
const removeMock = jest.fn();
const selectAllMock = jest.fn(() => ({ remove: removeMock }));
const selectSvgMock = jest.fn(() => ({ selectAll: selectAllMock }));
const selectMock = jest.fn(() => ({ select: selectSvgMock }));
const initMock = jest.fn(() => ({ resetZoom: jest.fn(), destroy: jest.fn(), getTransform: jest.fn(), setTransform: jest.fn() }));
const seedMock = jest.fn(() => []);

const loadTreeLibraries = jest.fn(() =>
  Promise.resolve({
    d3: { select: selectMock },
    dTree: { init: initMock },
    dSeeder: { seed: seedMock },
  })
);

module.exports = {
  loadTreeLibraries,
  seedMock,
  selectMock,
  selectSvgMock,
  selectAllMock,
  removeMock,
  initMock,
};
