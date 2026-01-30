// Base utility
export { cn } from './utils';

// Alert Dialog
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './components/alert-dialog';

// Avatar
export { Avatar, AvatarImage, AvatarFallback } from './components/avatar';

// Badge
export { Badge, badgeVariants } from './components/badge';

// Button
export { Button, buttonVariants, type ButtonProps } from './components/button';

// Card
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './components/card';

// Checkbox
export { Checkbox } from './components/checkbox';

// Dialog
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './components/dialog';

// Dropdown Menu
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './components/dropdown-menu';

// Form
export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from './components/form';

// Input
export { Input, type InputProps } from './components/input';

// Input OTP
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from './components/input-otp';

// Label
export { Label } from './components/label';

// Popover
export { Popover, PopoverTrigger, PopoverContent } from './components/popover';

// Radio Group
export { RadioGroup, RadioGroupItem } from './components/radio-group';

// Select
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './components/select';

// Skeleton
export { Skeleton } from './components/skeleton';

// Switch
export { Switch } from './components/switch';

// Table
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './components/table';

// Tabs
export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/tabs';

// Toast
export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  type ToastProps,
  type ToastActionElement,
} from './components/toast';

// Toaster (pre-built toast component)
export { Toaster } from './components/toaster';
export { useToast, toast, type Toast as ToastType } from './hooks/use-toast';

// Toggle
export { Toggle, toggleVariants } from './components/toggle';

// Toggle Group
export { ToggleGroup, ToggleGroupItem } from './components/toggle-group';

// Tooltip
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/tooltip';

// === Extended Components ===

// Spin (loading spinner)
export { default as Spin } from './components/spin';

// HelperText
export { default as HelperText } from './components/helper-text';

// ErrorTip
export { default as ErrorTip } from './components/error-tip';

// CardWrapper
export { default as CardWrapper } from './components/card-wrapper';

// LoadingSkeleton
export { LoadingSkeleton } from './components/loading-skeleton';

// ProcessingTip
export { default as ProcessingTip } from './components/processing-tip';

// RedDot
export { RedDot, type RedDotProps } from './components/red-dot';

// Slogan
export { default as Slogan } from './components/slogan';

// EyeOnOff
export { EyeOnOff } from './components/eye-on-off';
