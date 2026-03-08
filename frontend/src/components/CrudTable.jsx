/**
 * Backward-compatible barrel re-export.
 * All UI components now live in ./ui/ for better code organization.
 * Existing imports from './components/CrudTable' continue to work.
 */
export {
  useIsMobile,
  Modal,
  ModalActions,
  FormField,
  Input,
  Select,
  TextArea,
  Button,
  StatCard,
  CardInfoRow,
  CardActions,
  getAvatarColor,
  MobileCardWrapper,
  DataTable,
  PageHeader,
  SearchBar,
} from './ui/index';
