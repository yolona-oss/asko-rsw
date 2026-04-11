// Utils
export { cn } from './utils/cn';

// Components
export { AddressInput } from './components/address-input';
export type { AddressInputProps, AddressValue } from './components/address-input';

export { AddressView } from './components/address-view';
export type { AddressViewProps } from './components/address-view';

export { Button } from './components/button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/button';

export { Input } from './components/input';
export type { InputProps } from './components/input';

export { PatternInput } from './components/pattern-input';
export type { PatternInputProps, ValidationResult } from './components/pattern-input';

export { NameInput } from './components/name-input'
export type { NameInputProps } from './components/name-input'

export { PhoneInput } from './components/phone-input';
export type { PhoneInputProps } from './components/phone-input';

export { SerialNumberInput } from './components/serial-number-input';
export type { SerialNumberInputProps } from './components/serial-number-input';

export { PasswordInput } from './components/password-input';
export type { PasswordInputProps, PasswordRule } from './components/password-input';

export { EmailInput } from './components/email-input';
export type { EmailInputProps } from './components/email-input';

export { Textarea } from './components/textarea';
export type { TextareaProps } from './components/textarea';

export { Select } from './components/select';
export type { SelectProps } from './components/select';

export { FormField } from './components/form-field';
export type { FormFieldProps } from './components/form-field';

export { Card } from './components/card';
export type { CardProps } from './components/card';

export { Badge } from './components/badge';
export type { BadgeProps, BadgeVariant } from './components/badge';

export { TabList, Tab } from './components/tabs';
export type { TabListProps, TabProps } from './components/tabs';

export { Toggle } from './components/toggle';
export type { ToggleProps } from './components/toggle';

export { Modal } from './components/modal';
export type { ModalProps } from './components/modal';

export { Dialog } from './components/dialog';
export type { DialogProps } from './components/dialog';


export { Dropdown, DropdownMenu, ContextMenu, ContextMenuArea } from './components/dropdown';
export type {
  DropdownProps,
  DropdownPlacement,
  DropdownMenuProps,
  DropdownMenuItem,
  DropdownMenuEntry,
  ContextMenuProps,
  ContextMenuAreaProps,
} from './components/dropdown';

export { DataGrid } from './components/data-grid';
export type { DataGridProps, DataGridColumn, SortOrder } from './components/data-grid';

export { Container } from './components/container';
export type { ContainerProps } from './components/container';

export { Stack } from './components/stack';
export type { StackProps } from './components/stack';

export { Section } from './components/section';
export type { SectionProps } from './components/section';

export { KeyValueEditor, kvToRecord, recordToKV } from './components/key-value-editor';
export type { KeyValueEditorProps, KVPair } from './components/key-value-editor';

export { CropModal } from './components/crop-modal';
export type { CropModalProps, CropShape } from './components/crop-modal';

export { Avatar } from './components/avatar';
export type { AvatarProps, AvatarSize } from './components/avatar';

export {
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  VIEW_LIST,
  VIEW_GROUPED,
} from './components/view-switcher';
export type { ViewSwitcherProps, ViewDefinition } from './components/view-switcher';

export { DataGroupedView } from './components/data-grouped-view';
export type { DataGroupedViewProps, DataGroup } from './components/data-grouped-view';

export {
  DataCardView,
  DataCard,
  DataCardField,
  buildCardMenuItems,
} from './components/data-card-view';
export type {
  DataCardViewProps,
  DataCardProps,
  DataCardFieldProps,
  CardGridColumns,
} from './components/data-card-view';

export {
  DataListView,
  DataListItem,
} from './components/data-list-view';
export type {
  DataListViewProps,
  DataListItemProps,
} from './components/data-list-view';

export {
  DataFilter,
  ActiveFilters,
  getFilterValues,
  matchesFilter,
  filterValueToParam,
} from './components/data-filter';
export type {
  DataFilterProps,
  ActiveFiltersProps,
  FilterDefinition,
  FilterOption,
  FilterValues,
} from './components/data-filter';

export { DataSearch } from './components/data-search';
export type { DataSearchProps } from './components/data-search';

export { Pagination } from './components/pagination';
export type { PaginationProps } from './components/pagination';

export { DataToolbar } from './components/data-toolbar';
export type { DataToolbarProps, DataToolbarSearchProps } from './components/data-toolbar';

export { ImageGallery, LightboxModal } from './components/image-gallery';
export type { ImageGalleryProps, ImageGalleryZoomConfig } from './components/image-gallery';

export { Tooltip } from './components/tooltip';
export type { TooltipProps, TooltipPlacement, TooltipTrigger } from './components/tooltip';

export { Checkbox } from './components/checkbox';
export type { CheckboxProps } from './components/checkbox';

export { StatusBadge } from './components/status-badge';
export type { StatusBadgeProps } from './components/status-badge';

export { CopyButton } from './components/copy-button';
export type { CopyButtonProps } from './components/copy-button';

export { DetailRow } from './components/detail-row';

export { DetailSection } from './components/detail-section';
export type { DetailSectionProps } from './components/detail-section';
export type { DetailRowProps } from './components/detail-row';

export { SkeletonBlock, SkeletonCircle, SkeletonCard } from './components/skeleton';
export type { SkeletonBlockProps, SkeletonCircleProps, SkeletonCardProps } from './components/skeleton';

export {
  BarChart,
  LineChart,
  ChartTooltip,
  ChartCard,
  DateRangeModal,
  defaultRange,
  formatRangeLabel,
  toInputDate,
  DEFAULT_RANGE_PRESETS,
} from './components/chart';
export type {
  ChartStyle,
  ChartBucket,
  DateRange,
  RangePreset,
  BarChartProps,
  LineChartProps,
  ChartTooltipProps,
  ChartCardProps,
  DateRangeModalProps,
} from './components/chart';

export { StatCard } from './components/stat-card';
export type { StatCardProps, StatCardTrend } from './components/stat-card';

export { ProgressBar } from './components/progress-bar';
export type { ProgressBarProps, ProgressBarSize } from './components/progress-bar';

export { DonutChart } from './components/donut-chart';
export type { DonutChartProps, DonutSegment } from './components/donut-chart';

export { Sparkline } from './components/sparkline';
export type { SparklineProps } from './components/sparkline';

export { MetricComparison } from './components/metric-comparison';
export type { MetricComparisonProps, MetricComparisonItem } from './components/metric-comparison';
