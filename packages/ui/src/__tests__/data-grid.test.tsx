import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DataGrid, type DataGridColumn } from '../components/data-grid';

// ─── Test helpers ────────────────────────────────────────────────────────────

interface Row {
  id: string;
  name: string;
  email: string;
  age: number;
}

const sampleData: Row[] = [
  { id: '1', name: 'Alice', email: 'alice@test.com', age: 30 },
  { id: '2', name: 'Bob', email: 'bob@test.com', age: 25 },
  { id: '3', name: 'Charlie', email: 'charlie@test.com', age: 35 },
];

const columns: DataGridColumn<Row>[] = [
  { key: 'name', header: 'Name', render: (r) => r.name },
  { key: 'email', header: 'Email', render: (r) => r.email },
  { key: 'age', header: 'Age', render: (r) => r.age },
];

const keyExtractor = (r: Row) => r.id;

function renderGrid(props: Partial<Parameters<typeof DataGrid<Row>>[0]> = {}) {
  return render(
    <DataGrid<Row>
      columns={columns}
      data={sampleData}
      keyExtractor={keyExtractor}
      {...props}
    />,
  );
}

/** Find a header cell by column key via data-col attribute */
function getHeaderCell(key: string) {
  return document.querySelector(`[data-col="${key}"]`) as HTMLElement;
}

/** Find the resize handle inside a header cell */
function getResizeHandle(key: string) {
  const cell = getHeaderCell(key);
  return cell?.querySelector('.cursor-col-resize') as HTMLElement;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DataGrid', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Basic rendering ────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders column headers', () => {
      renderGrid();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
    });

    it('renders data rows', () => {
      renderGrid();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('bob@test.com')).toBeInTheDocument();
      expect(screen.getByText('35')).toBeInTheDocument();
    });

    it('renders empty content when data is empty', () => {
      renderGrid({ data: [], emptyContent: 'No data found' });
      expect(screen.getByText('No data found')).toBeInTheDocument();
    });

    it('renders footer', () => {
      renderGrid({ footer: <span>Page 1 of 3</span> });
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = renderGrid({ className: 'my-custom-class' });
      expect(container.firstElementChild).toHaveClass('my-custom-class');
    });

    it('applies rowClassName per row', () => {
      renderGrid({
        rowClassName: (r) => (r.name === 'Bob' ? 'highlighted' : undefined),
      });
      // Find the row containing "Bob" and check its class
      const bobCell = screen.getByText('Bob');
      const row = bobCell.closest('[class*="hover:bg-surface-hover"]')!;
      expect(row).toHaveClass('highlighted');
    });
  });

  // ── Loading / skeleton ─────────────────────────────────────────────────

  describe('loading state', () => {
    it('renders skeleton rows when loading', () => {
      const { container } = renderGrid({ loading: true });
      // Default loadingRows = 5, each row has 3 columns = 15 skeletons
      const skeletons = container.querySelectorAll('.h-4.w-full');
      expect(skeletons.length).toBe(15);
    });

    it('respects custom loadingRows count', () => {
      const { container } = renderGrid({ loading: true, loadingRows: 3 });
      const skeletons = container.querySelectorAll('.h-4.w-full');
      expect(skeletons.length).toBe(9); // 3 rows * 3 columns
    });

    it('does not render data rows when loading', () => {
      renderGrid({ loading: true });
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });
  });

  // ── Sorting ────────────────────────────────────────────────────────────

  describe('sorting', () => {
    it('calls onSort with asc on first header click', () => {
      const onSort = vi.fn();
      renderGrid({ onSort });
      fireEvent.click(getHeaderCell('name'));
      expect(onSort).toHaveBeenCalledWith('name', 'asc');
    });

    it('cycles asc → desc → clear', () => {
      const onSort = vi.fn();
      // Start unsorted
      const { rerender } = render(
        <DataGrid columns={columns} data={sampleData} keyExtractor={keyExtractor} onSort={onSort} />,
      );

      fireEvent.click(getHeaderCell('name'));
      expect(onSort).toHaveBeenCalledWith('name', 'asc');

      // Rerender as sorted asc
      rerender(
        <DataGrid columns={columns} data={sampleData} keyExtractor={keyExtractor} onSort={onSort} sortKey="name" sortOrder="asc" />,
      );
      fireEvent.click(getHeaderCell('name'));
      expect(onSort).toHaveBeenCalledWith('name', 'desc');

      // Rerender as sorted desc
      rerender(
        <DataGrid columns={columns} data={sampleData} keyExtractor={keyExtractor} onSort={onSort} sortKey="name" sortOrder="desc" />,
      );
      fireEvent.click(getHeaderCell('name'));
      expect(onSort).toHaveBeenCalledWith(null, null);
    });

    it('uses sortField when provided', () => {
      const onSort = vi.fn();
      const cols: DataGridColumn<Row>[] = [
        { key: 'name', header: 'Name', sortField: 'user_name', render: (r) => r.name },
      ];
      render(
        <DataGrid columns={cols} data={sampleData} keyExtractor={keyExtractor} onSort={onSort} />,
      );
      fireEvent.click(getHeaderCell('name'));
      expect(onSort).toHaveBeenCalledWith('user_name', 'asc');
    });

    it('does not sort when sortable is false', () => {
      const onSort = vi.fn();
      const cols: DataGridColumn<Row>[] = [
        { key: 'name', header: 'Name', sortable: false, render: (r) => r.name },
      ];
      render(
        <DataGrid columns={cols} data={sampleData} keyExtractor={keyExtractor} onSort={onSort} />,
      );
      fireEvent.click(getHeaderCell('name'));
      expect(onSort).not.toHaveBeenCalled();
    });

    it('does not sort when onSort is not provided', () => {
      renderGrid();
      // Should not throw
      fireEvent.click(getHeaderCell('name'));
    });
  });

  // ── Row click / double click ───────────────────────────────────────────

  describe('row interactions', () => {
    it('calls onRowClick on click', () => {
      const onClick = vi.fn();
      renderGrid({ onRowClick: onClick });

      fireEvent.click(screen.getByText('Alice'));
      expect(onClick).toHaveBeenCalledWith(sampleData[0]);
    });

    it('calls onRowDoubleClick on double click', () => {
      const onDblClick = vi.fn();
      renderGrid({ onRowDoubleClick: onDblClick });

      const cell = screen.getByText('Alice');
      const row = cell.closest('[class*="hover:bg-surface-hover"]')!;
      fireEvent.doubleClick(row);
      expect(onDblClick).toHaveBeenCalledWith(sampleData[0]);
    });

    it('debounces single click when both click and double click are set', () => {
      const onClick = vi.fn();
      const onDblClick = vi.fn();
      renderGrid({ onRowClick: onClick, onRowDoubleClick: onDblClick });

      const cell = screen.getByText('Alice');
      const row = cell.closest('[class*="hover:bg-surface-hover"]')!;

      // Single click — should not fire immediately
      fireEvent.click(row);
      expect(onClick).not.toHaveBeenCalled();

      // After debounce period (250ms) it fires
      act(() => vi.advanceTimersByTime(300));
      expect(onClick).toHaveBeenCalledWith(sampleData[0]);
    });

    it('cancels single click on double click', () => {
      const onClick = vi.fn();
      const onDblClick = vi.fn();
      renderGrid({ onRowClick: onClick, onRowDoubleClick: onDblClick });

      const cell = screen.getByText('Alice');
      const row = cell.closest('[class*="hover:bg-surface-hover"]')!;

      // Click then double click fast
      fireEvent.click(row);
      fireEvent.doubleClick(row);

      act(() => vi.advanceTimersByTime(300));
      expect(onClick).not.toHaveBeenCalled();
      expect(onDblClick).toHaveBeenCalledWith(sampleData[0]);
    });
  });

  // ── Column resize ─────────────────────────────────────────────────────

  describe('column resize', () => {
    it('does not render resize handle on last column', () => {
      renderGrid();
      // "age" is the last column — should have no resize handle
      expect(getResizeHandle('age')).toBeNull();
      // "name" is not last — should have a resize handle
      expect(getResizeHandle('name')).not.toBeNull();
    });

    it('updates column width on drag', () => {
      const { container } = renderGrid();
      const handle = getResizeHandle('name')!;

      // Start resize
      fireEvent.mouseDown(handle, { clientX: 100 });

      // Drag 50px to the right
      fireEvent.mouseMove(document, { clientX: 150 });

      // Release
      fireEvent.mouseUp(document);

      // The header row should now have a px value for the resized column
      const headerRow = container.querySelector('[style*="grid-template-columns"]') as HTMLElement;
      expect(headerRow.style.gridTemplateColumns).toContain('px');
    });

    it('respects minimum width during resize', () => {
      const cols: DataGridColumn<Row>[] = [
        { key: 'name', header: 'Name', width: 200, minWidth: 80, render: (r) => r.name },
        { key: 'email', header: 'Email', render: (r) => r.email },
      ];
      render(
        <DataGrid columns={cols} data={sampleData} keyExtractor={keyExtractor} />,
      );
      const handle = getResizeHandle('name')!;

      // Start resize at width 200, drag far left to try to go below minWidth
      fireEvent.mouseDown(handle, { clientX: 300 });
      fireEvent.mouseMove(document, { clientX: 50 }); // -250px drag
      fireEvent.mouseUp(document);

      const headerRow = document.querySelector('[style*="grid-template-columns"]') as HTMLElement;
      // Should clamp to minWidth (80px), not go below
      expect(headerRow.style.gridTemplateColumns).toContain('80px');
    });

    it('cleans up document listeners on mouseup', () => {
      renderGrid();
      const handle = getResizeHandle('name')!;

      const removeSpy = vi.spyOn(document, 'removeEventListener');

      fireEvent.mouseDown(handle, { clientX: 100 });
      fireEvent.mouseUp(document);

      expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      removeSpy.mockRestore();
    });

    it('does not throw when resizeRef is nulled before setWidths callback (bug fix)', () => {
      renderGrid();
      const handle = getResizeHandle('name')!;

      // Start resize, move, then immediately release
      // This exercises the code path where resizeRef.current is set to null
      // in onUp before the setWidths updater runs
      expect(() => {
        fireEvent.mouseDown(handle, { clientX: 100 });
        fireEvent.mouseMove(document, { clientX: 150 });
        fireEvent.mouseUp(document);
        // Extra moves after mouseup — resizeRef.current is null, should bail
        fireEvent.mouseMove(document, { clientX: 200 });
      }).not.toThrow();
    });
  });

  // ── Grid template ─────────────────────────────────────────────────────

  describe('grid template', () => {
    it('uses px for fixed-width columns', () => {
      const cols: DataGridColumn<Row>[] = [
        { key: 'name', header: 'Name', width: 200, render: (r) => r.name },
        { key: 'email', header: 'Email', render: (r) => r.email },
      ];
      const { container } = render(
        <DataGrid columns={cols} data={sampleData} keyExtractor={keyExtractor} />,
      );
      const headerRow = container.querySelector('[style*="grid-template-columns"]') as HTMLElement;
      const template = headerRow.style.gridTemplateColumns;
      expect(template).toMatch(/^200px/);
    });

    it('uses minmax(min, fr) for flexible columns', () => {
      const { container } = renderGrid();
      const headerRow = container.querySelector('[style*="grid-template-columns"]') as HTMLElement;
      const template = headerRow.style.gridTemplateColumns;
      expect(template).toMatch(/minmax\(\d+px,/);
    });

    it('respects custom minWidth', () => {
      const cols: DataGridColumn<Row>[] = [
        { key: 'name', header: 'Name', minWidth: 250, render: (r) => r.name },
      ];
      const { container } = render(
        <DataGrid columns={cols} data={sampleData} keyExtractor={keyExtractor} />,
      );
      const headerRow = container.querySelector('[style*="grid-template-columns"]') as HTMLElement;
      expect(headerRow.style.gridTemplateColumns).toContain('minmax(250px,');
    });
  });

  // ── Row context menu ───────────────────────────────────────────────────

  describe('row context menu', () => {
    it('opens context menu on right-click when rowMenu is set', () => {
      renderGrid({
        rowMenu: () => [{ key: 'delete', label: 'Delete' }],
      });

      const cell = screen.getByText('Alice');
      const row = cell.closest('[class*="hover:bg-surface-hover"]')!;
      fireEvent.contextMenu(row, { clientX: 100, clientY: 100 });

      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('auto-injects detail item when onRowClick is set', () => {
      renderGrid({
        onRowClick: vi.fn(),
      });

      const cell = screen.getByText('Alice');
      const row = cell.closest('[class*="hover:bg-surface-hover"]')!;
      fireEvent.contextMenu(row, { clientX: 100, clientY: 100 });

      expect(screen.getByText('Подробнее')).toBeInTheDocument();
    });

    it('auto-injects edit item when onRowDoubleClick is set', () => {
      renderGrid({
        onRowDoubleClick: vi.fn(),
      });

      const cell = screen.getByText('Alice');
      const row = cell.closest('[class*="hover:bg-surface-hover"]')!;
      fireEvent.contextMenu(row, { clientX: 100, clientY: 100 });

      expect(screen.getByText('Перейти')).toBeInTheDocument();
    });

    it('suppresses detail item when suppressDetailMenuItem is true', () => {
      renderGrid({
        onRowClick: vi.fn(),
        suppressDetailMenuItem: true,
      });

      const cell = screen.getByText('Alice');
      const row = cell.closest('[class*="hover:bg-surface-hover"]')!;
      fireEvent.contextMenu(row, { clientX: 100, clientY: 100 });

      expect(screen.queryByText('Подробнее')).not.toBeInTheDocument();
    });

    it('does not render context menu when no rowMenu and no click handlers', () => {
      renderGrid();

      const cell = screen.getByText('Alice');
      const row = cell.closest('[class*="hover:bg-surface-hover"]')!;
      fireEvent.contextMenu(row);

      expect(screen.queryByText('Подробнее')).not.toBeInTheDocument();
      expect(screen.queryByText('Перейти')).not.toBeInTheDocument();
    });
  });

  // ── Header context menu ────────────────────────────────────────────────

  describe('header context menu', () => {
    it('opens header context menu on right-click', () => {
      renderGrid({ onSort: vi.fn() });

      const headerCell = getHeaderCell('name');
      fireEvent.contextMenu(headerCell, { clientX: 100, clientY: 100 });

      expect(screen.getByText('По возрастанию')).toBeInTheDocument();
      expect(screen.getByText('По убыванию')).toBeInTheDocument();
      expect(screen.getByText('Убрать столбец')).toBeInTheDocument();
      expect(screen.getByText('Сброс настроек')).toBeInTheDocument();
    });

    it('hides column via context menu', () => {
      renderGrid({ onSort: vi.fn() });

      // Right-click to get context menu
      fireEvent.contextMenu(getHeaderCell('email'), { clientX: 100, clientY: 100 });

      // Click "Убрать столбец"
      fireEvent.click(screen.getByText('Убрать столбец'));

      // Email column should be gone from header
      expect(document.querySelector('[data-col="email"]')).toBeNull();
      // Email data should also be hidden
      expect(screen.queryByText('alice@test.com')).not.toBeInTheDocument();
    });
  });

  // ── Mobile labels ──────────────────────────────────────────────────────

  describe('mobile labels', () => {
    it('renders mobileLabel when set', () => {
      const cols: DataGridColumn<Row>[] = [
        { key: 'name', header: 'Name', mobileLabel: 'User Name', render: (r) => r.name },
      ];
      render(
        <DataGrid columns={cols} data={sampleData} keyExtractor={keyExtractor} />,
      );
      expect(screen.getAllByText('User Name')).toHaveLength(sampleData.length);
    });
  });

  // ── Column visibility (hide / show / reset) ───────────────────────────

  describe('column visibility', () => {
    it('shows placeholder when all columns are hidden', () => {
      const cols: DataGridColumn<Row>[] = [
        { key: 'name', header: 'Name', render: (r) => r.name },
      ];
      render(
        <DataGrid columns={cols} data={sampleData} keyExtractor={keyExtractor} onSort={vi.fn()} />,
      );

      // Hide the only column
      fireEvent.contextMenu(getHeaderCell('name'), { clientX: 10, clientY: 10 });
      fireEvent.click(screen.getByText('Убрать столбец'));

      expect(screen.getByText(/Все столбцы скрыты/)).toBeInTheDocument();
    });

    it('restores a hidden column from the aside panel', () => {
      renderGrid({ onSort: vi.fn() });

      // Hide "Email"
      fireEvent.contextMenu(getHeaderCell('email'), { clientX: 10, clientY: 10 });
      fireEvent.click(screen.getByText('Убрать столбец'));
      expect(document.querySelector('[data-col="email"]')).toBeNull();

      // Open context menu on remaining column — aside should list "Email"
      fireEvent.contextMenu(getHeaderCell('name'), { clientX: 10, clientY: 10 });
      fireEvent.click(screen.getByText('Email'));

      // Email column should be back
      expect(document.querySelector('[data-col="email"]')).not.toBeNull();
      expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    });

    it('reset restores hidden columns and clears resized widths', () => {
      renderGrid({ onSort: vi.fn() });

      // Resize "name"
      const handle = getResizeHandle('name')!;
      fireEvent.mouseDown(handle, { clientX: 100 });
      fireEvent.mouseMove(document, { clientX: 300 });
      fireEvent.mouseUp(document);

      // Hide "email"
      fireEvent.contextMenu(getHeaderCell('email'), { clientX: 10, clientY: 10 });
      fireEvent.click(screen.getByText('Убрать столбец'));
      expect(document.querySelector('[data-col="email"]')).toBeNull();

      // Reset via context menu
      fireEvent.contextMenu(getHeaderCell('name'), { clientX: 10, clientY: 10 });
      fireEvent.click(screen.getByText('Сброс настроек'));

      // Email restored
      expect(document.querySelector('[data-col="email"]')).not.toBeNull();

      // Widths cleared — template should have no hardcoded px (only minmax)
      const headerRow = document.querySelector('[style*="grid-template-columns"]') as HTMLElement;
      expect(headerRow.style.gridTemplateColumns).not.toMatch(/^\d+px/);
    });
  });

  // ── Header context menu (extra edges) ──────────────────────────────────

  describe('header context menu (edges)', () => {
    it('omits sort items when onSort is not provided', () => {
      renderGrid();

      fireEvent.contextMenu(getHeaderCell('name'), { clientX: 10, clientY: 10 });

      expect(screen.queryByText('По возрастанию')).not.toBeInTheDocument();
      expect(screen.queryByText('По убыванию')).not.toBeInTheDocument();
      // Reset should still be present
      expect(screen.getByText('Сброс настроек')).toBeInTheDocument();
    });

    it('omits sort items for non-sortable column', () => {
      const cols: DataGridColumn<Row>[] = [
        { key: 'name', header: 'Name', sortable: false, render: (r) => r.name },
        { key: 'email', header: 'Email', render: (r) => r.email },
      ];
      render(
        <DataGrid columns={cols} data={sampleData} keyExtractor={keyExtractor} onSort={vi.fn()} />,
      );

      fireEvent.contextMenu(getHeaderCell('name'), { clientX: 10, clientY: 10 });

      expect(screen.queryByText('По возрастанию')).not.toBeInTheDocument();
      expect(screen.getByText('Убрать столбец')).toBeInTheDocument();
    });

    it('context menu on header background has no column-specific items', () => {
      renderGrid({ onSort: vi.fn() });

      // Right-click on the header row container itself (not on a data-col child).
      // fireEvent sets e.target to the element, and the header row has no
      // data-col attribute, so closest('[data-col]') returns null → columnKey=null.
      const headerRow = document.querySelector('[class*="bg-surface-secondary"]') as HTMLElement;
      fireEvent.contextMenu(headerRow, { clientX: 10, clientY: 10 });

      // "Убрать столбец" requires a column key — should not be present
      expect(screen.queryByText('Убрать столбец')).not.toBeInTheDocument();
      expect(screen.getByText('Сброс настроек')).toBeInTheDocument();
    });

    it('hidden columns appear in aside panel', () => {
      renderGrid({ onSort: vi.fn() });

      // Hide "Age"
      fireEvent.contextMenu(getHeaderCell('age'), { clientX: 10, clientY: 10 });
      fireEvent.click(screen.getByText('Убрать столбец'));

      // Open context menu on "Name" — aside should show "Age"
      fireEvent.contextMenu(getHeaderCell('name'), { clientX: 10, clientY: 10 });
      expect(screen.getByText('Скрытые столбцы')).toBeInTheDocument();
    });

    it('sort items from context menu call onSort', () => {
      const onSort = vi.fn();
      renderGrid({ onSort });

      fireEvent.contextMenu(getHeaderCell('name'), { clientX: 10, clientY: 10 });
      fireEvent.click(screen.getByText('По возрастанию'));
      expect(onSort).toHaveBeenCalledWith('name', 'asc');

      fireEvent.contextMenu(getHeaderCell('name'), { clientX: 10, clientY: 10 });
      fireEvent.click(screen.getByText('По убыванию'));
      expect(onSort).toHaveBeenCalledWith('name', 'desc');
    });
  });

  // ── Row context menu (extra edges) ─────────────────────────────────────

  describe('row context menu (edges)', () => {
    it('combines user items with auto items', () => {
      renderGrid({
        onRowClick: vi.fn(),
        rowMenu: () => [{ key: 'custom', label: 'Custom Action' }],
      });

      const row = screen.getByText('Alice').closest('[class*="hover:bg-surface-hover"]')!;
      fireEvent.contextMenu(row, { clientX: 10, clientY: 10 });

      // Both auto and custom items present
      expect(screen.getByText('Подробнее')).toBeInTheDocument();
      expect(screen.getByText('Custom Action')).toBeInTheDocument();
    });

    it('clicking auto-injected "Подробнее" calls onRowClick', () => {
      const onClick = vi.fn();
      renderGrid({ onRowClick: onClick });

      const row = screen.getByText('Bob').closest('[class*="hover:bg-surface-hover"]')!;
      fireEvent.contextMenu(row, { clientX: 10, clientY: 10 });
      fireEvent.click(screen.getByText('Подробнее'));

      expect(onClick).toHaveBeenCalledWith(sampleData[1]);
    });

    it('clicking auto-injected "Перейти" calls onRowDoubleClick', () => {
      const onDblClick = vi.fn();
      renderGrid({ onRowDoubleClick: onDblClick });

      const row = screen.getByText('Charlie').closest('[class*="hover:bg-surface-hover"]')!;
      fireEvent.contextMenu(row, { clientX: 10, clientY: 10 });
      fireEvent.click(screen.getByText('Перейти'));

      expect(onDblClick).toHaveBeenCalledWith(sampleData[2]);
    });
  });

  // ── Touch events ───────────────────────────────────────────────────────

  describe('touch events', () => {
    it('long press opens row context menu', () => {
      renderGrid({ onRowClick: vi.fn() });

      const row = screen.getByText('Alice').closest('[class*="hover:bg-surface-hover"]')!;
      fireEvent.touchStart(row, { touches: [{ clientX: 50, clientY: 50 }] });

      // Before 500ms — no menu
      act(() => vi.advanceTimersByTime(400));
      expect(screen.queryByText('Подробнее')).not.toBeInTheDocument();

      // After 500ms — menu appears
      act(() => vi.advanceTimersByTime(200));
      expect(screen.getByText('Подробнее')).toBeInTheDocument();
    });

    it('touch move cancels long press', () => {
      renderGrid({ onRowClick: vi.fn() });

      const row = screen.getByText('Alice').closest('[class*="hover:bg-surface-hover"]')!;
      fireEvent.touchStart(row, { touches: [{ clientX: 50, clientY: 50 }] });

      act(() => vi.advanceTimersByTime(200));
      fireEvent.touchMove(row);

      // Wait past threshold — menu should NOT appear
      act(() => vi.advanceTimersByTime(400));
      expect(screen.queryByText('Подробнее')).not.toBeInTheDocument();
    });

    it('touch end cancels long press', () => {
      renderGrid({ onRowClick: vi.fn() });

      const row = screen.getByText('Alice').closest('[class*="hover:bg-surface-hover"]')!;
      fireEvent.touchStart(row, { touches: [{ clientX: 50, clientY: 50 }] });

      act(() => vi.advanceTimersByTime(200));
      fireEvent.touchEnd(row);

      act(() => vi.advanceTimersByTime(400));
      expect(screen.queryByText('Подробнее')).not.toBeInTheDocument();
    });
  });

  // ── Resize (extra edges) ───────────────────────────────────────────────

  describe('column resize (edges)', () => {
    it('sets body cursor and userSelect during drag', () => {
      renderGrid();
      const handle = getResizeHandle('name')!;

      fireEvent.mouseDown(handle, { clientX: 100 });
      expect(document.body.style.cursor).toBe('col-resize');
      expect(document.body.style.userSelect).toBe('none');

      fireEvent.mouseUp(document);
      expect(document.body.style.cursor).toBe('');
      expect(document.body.style.userSelect).toBe('');
    });

    it('resize handle click does not trigger sort', () => {
      const onSort = vi.fn();
      renderGrid({ onSort });

      const handle = getResizeHandle('name')!;
      fireEvent.click(handle);

      expect(onSort).not.toHaveBeenCalled();
    });

    it('uses default minWidth (60) when column has no minWidth', () => {
      const cols: DataGridColumn<Row>[] = [
        { key: 'name', header: 'Name', width: 100, render: (r) => r.name },
        { key: 'email', header: 'Email', render: (r) => r.email },
      ];
      render(
        <DataGrid columns={cols} data={sampleData} keyExtractor={keyExtractor} />,
      );
      const handle = getResizeHandle('name')!;

      // Drag far left to hit default minWidth
      fireEvent.mouseDown(handle, { clientX: 200 });
      fireEvent.mouseMove(document, { clientX: 0 }); // -200px
      fireEvent.mouseUp(document);

      const headerRow = document.querySelector('[style*="grid-template-columns"]') as HTMLElement;
      expect(headerRow.style.gridTemplateColumns).toContain('60px');
    });
  });

  // ── Rendering (extra edges) ────────────────────────────────────────────

  describe('rendering (edges)', () => {
    it('empty data without emptyContent renders no rows and no message', () => {
      const { container } = renderGrid({ data: [] });
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
      const body = container.querySelector('[class*="text-center"]');
      expect(body).toBeNull();
    });

    it('multiline column uses whitespace-normal class', () => {
      const cols: DataGridColumn<Row>[] = [
        { key: 'name', header: 'Name', multiline: true, render: (r) => r.name },
      ];
      const { container } = render(
        <DataGrid columns={cols} data={[sampleData[0]]} keyExtractor={keyExtractor} />,
      );
      const cell = container.querySelector('.whitespace-normal');
      expect(cell).not.toBeNull();
      expect(cell).toHaveTextContent('Alice');
    });

    it('non-multiline column uses truncate class', () => {
      const { container } = renderGrid();
      const cell = container.querySelector('.truncate');
      expect(cell).not.toBeNull();
    });

    it('uses custom tooltip from col.tooltip', () => {
      const cols: DataGridColumn<Row>[] = [
        { key: 'name', header: 'Name', tooltip: (r) => `User: ${r.name}`, render: (r) => r.name },
      ];
      const { container } = render(
        <DataGrid columns={cols} data={[sampleData[0]]} keyExtractor={keyExtractor} />,
      );
      const cell = container.querySelector('[title="User: Alice"]');
      expect(cell).not.toBeNull();
    });
  });

  // ── Auto-sizing ────────────────────────────────────────────────────────

  describe('auto-sizing', () => {
    it('weight coefficient changes fr ratio', () => {
      const normalCols: DataGridColumn<Row>[] = [
        { key: 'name', header: 'Name', render: (r) => r.name },
        { key: 'email', header: 'Email', render: (r) => r.email },
      ];
      const weightedCols: DataGridColumn<Row>[] = [
        { key: 'name', header: 'Name', weight: 3, render: (r) => r.name },
        { key: 'email', header: 'Email', weight: 1, render: (r) => r.email },
      ];

      const { container: c1 } = render(
        <DataGrid columns={normalCols} data={sampleData} keyExtractor={keyExtractor} />,
      );
      const t1 = (c1.querySelector('[style*="grid-template-columns"]') as HTMLElement).style.gridTemplateColumns;

      const { container: c2 } = render(
        <DataGrid columns={weightedCols} data={sampleData} keyExtractor={keyExtractor} />,
      );
      const t2 = (c2.querySelector('[style*="grid-template-columns"]') as HTMLElement).style.gridTemplateColumns;

      expect(t1).not.toBe(t2);
    });

    it('uses default minWidth of 100 in grid template', () => {
      const cols: DataGridColumn<Row>[] = [
        { key: 'name', header: 'Name', render: (r) => r.name },
      ];
      const { container } = render(
        <DataGrid columns={cols} data={sampleData} keyExtractor={keyExtractor} />,
      );
      const headerRow = container.querySelector('[style*="grid-template-columns"]') as HTMLElement;
      expect(headerRow.style.gridTemplateColumns).toContain('minmax(100px,');
    });
  });
});
