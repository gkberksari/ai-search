import {
  CheckCircle,
  Circle,
  CircleOff,
  MessageSquare,
  ThumbsUp,
  Timer,
  User,
  Users,
} from "lucide-react";

export const applicationStages = [
  {
    value: "Sourced",
    label: "Sourced",
    icon: User,
  },
  {
    value: "Applied",
    label: "Applied",
    icon: Circle,
  },
  {
    value: "Contacted",
    label: "Contacted",
    icon: MessageSquare,
  },
  {
    value: "Interview",
    label: "Interview",
    icon: Users,
  },
  {
    value: "Evaluation",
    label: "Evaluation",
    icon: Timer,
  },
  {
    value: "Offer",
    label: "Offer",
    icon: ThumbsUp,
  },
  {
    value: "Hired",
    label: "Hired",
    icon: CheckCircle,
  },
  {
    value: "Rejected",
    label: "Rejected",
    icon: CircleOff,
  },
];
