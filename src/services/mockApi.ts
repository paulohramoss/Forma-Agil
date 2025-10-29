type PaymentStatus = 'Pago' | 'Atrasado' | 'Em dia';

const cryptoId = () =>
  Math.random().toString(36).replace(/[^a-z0-9]+/g, '').slice(0, 10) +
  Date.now().toString(36).slice(-4);

export interface PaymentHistoryEntry {
  id: string;
  date: string;
  amount: number;
  status: PaymentStatus;
  method?: string;
  note?: string;
}

export interface Participant {
  id: string;
  name: string;
  status: PaymentStatus;
  value: number;
  whatsapp?: string;
  history: PaymentHistoryEntry[];
}

export interface FinanceSummary {
  totalGoal: number;
  collected: number;
  pending: number;
  nextDeadline: string;
  lastUpdated: string;
  fulfilledPercentage: number;
  latestPayments: PaymentHistoryEntry[];
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  closesAt: string;
  totalVotes: number;
}

export interface CommunicationMessage {
  id: string;
  channel: 'WhatsApp' | 'Email' | 'App';
  title: string;
  body: string;
  scheduledFor: string;
  audience: string;
  status: 'Agendado' | 'Enviado';
}

export interface ParticipantInput {
  name: string;
  value: number;
  whatsapp?: string;
  history?: PaymentHistoryEntry[];
}

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

const goal: number = 85000;
const baseDeadline = '15/08/2024';

const buildHistory = (
  entries: Array<Omit<PaymentHistoryEntry, 'id'>>,
): PaymentHistoryEntry[] => entries.map((entry) => ({ ...entry, id: cryptoId() }));

let participantsStore: Participant[] = [
  {
    id: cryptoId(),
    name: 'Ana Souza',
    status: 'Pago',
    value: 1200,
    whatsapp: '55 11 91234-5678',
    history: buildHistory([
      { date: '10/02/2024', amount: 600, status: 'Pago', method: 'PIX' },
      { date: '10/03/2024', amount: 600, status: 'Pago', method: 'PIX' },
    ]),
  },
  {
    id: cryptoId(),
    name: 'Bruno Lima',
    status: 'Atrasado',
    value: 1200,
    whatsapp: '55 11 99876-5432',
    history: buildHistory([
      { date: '08/02/2024', amount: 600, status: 'Pago', method: 'Boleto' },
      { date: '08/03/2024', amount: 600, status: 'Atrasado', method: 'Boleto' },
    ]),
  },
  {
    id: cryptoId(),
    name: 'Carla Mendes',
    status: 'Em dia',
    value: 1200,
    whatsapp: '55 11 98765-4321',
    history: buildHistory([
      { date: '12/02/2024', amount: 600, status: 'Pago', method: 'PIX' },
      { date: '12/03/2024', amount: 600, status: 'Em dia', method: 'PIX' },
    ]),
  },
];

const pollStore: Poll = {
  id: cryptoId(),
  question: 'Qual banda devemos contratar para a festa?',
  closesAt: '05/07/2024',
  options: [
    { id: cryptoId(), label: 'Banda Aurora', votes: 38 },
    { id: cryptoId(), label: 'DJ Set Formandos', votes: 22 },
    { id: cryptoId(), label: 'Grupo Samba&Som', votes: 17 },
  ],
  totalVotes: 77,
};

let communicationQueue: CommunicationMessage[] = [
  {
    id: cryptoId(),
    channel: 'WhatsApp',
    title: 'Cobrança parcela março',
    body: 'Olá! Lembrando que a parcela de março vence dia 15. Qualquer dúvida estamos por aqui.',
    audience: 'Todos os formandos',
    scheduledFor: '13/03/2024 19:00',
    status: 'Agendado',
  },
  {
    id: cryptoId(),
    channel: 'Email',
    title: 'Enquete: atrações para a festa',
    body: 'Participem da enquete para escolher a banda da festa! Link disponível no aplicativo.',
    audience: 'Todos os formandos',
    scheduledFor: '20/03/2024 08:00',
    status: 'Enviado',
  },
];

export async function getFinanceSummary(): Promise<FinanceSummary> {
  await delay();
  const collected = participantsStore.reduce((total, participant) => {
    const paid = participant.history
      .filter((entry) => entry.status === 'Pago')
      .reduce((sum, entry) => sum + entry.amount, 0);
    return total + paid;
  }, 0);

  const latestPayments = participantsStore
    .flatMap((participant) =>
      participant.history.map((entry) => ({
        ...entry,
        note: `${participant.name} - ${entry.status}`,
      })),
    )
    .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
    .slice(0, 5);

  return {
    totalGoal: goal,
    collected,
    pending: Math.max(goal - collected, 0),
    nextDeadline: baseDeadline,
    lastUpdated: new Date().toLocaleString('pt-BR'),
    fulfilledPercentage: goal === 0 ? 0 : Number((collected / goal).toFixed(2)),
    latestPayments,
  };
}

export async function getParticipants(): Promise<Participant[]> {
  await delay();
  return participantsStore.map((participant) => ({ ...participant }));
}

export async function getPoll(): Promise<Poll> {
  await delay();
  const totalVotes = pollStore.options.reduce((total, option) => total + option.votes, 0);
  return { ...pollStore, totalVotes };
}

export async function getCommunicationFeed(): Promise<CommunicationMessage[]> {
  await delay();
  return communicationQueue.map((item) => ({ ...item }));
}

export async function addParticipant(input: ParticipantInput): Promise<Participant> {
  await delay();
  const participant: Participant = {
    id: cryptoId(),
    name: input.name,
    value: input.value,
    whatsapp: input.whatsapp,
    history: input.history ? input.history.map((entry) => ({ ...entry, id: cryptoId() })) : [],
    status: deriveStatus(input.history),
  };
  participantsStore = [...participantsStore, participant];
  return participant;
}

export async function importParticipants(list: ParticipantInput[]): Promise<Participant[]> {
  await delay(600);
  const imported = list.map((item) => ({
    id: cryptoId(),
    name: item.name,
    value: item.value,
    whatsapp: item.whatsapp,
    history: item.history ? item.history.map((entry) => ({ ...entry, id: cryptoId() })) : [],
    status: deriveStatus(item.history),
  }));

  participantsStore = [...participantsStore, ...imported];
  return imported;
}

export async function recordPayment(
  participantId: string,
  payment: Omit<PaymentHistoryEntry, 'id'>,
): Promise<Participant | null> {
  await delay();
  const index = participantsStore.findIndex((participant) => participant.id === participantId);
  if (index === -1) {
    return null;
  }

  const updatedHistory = [
    participantsStore[index].history,
    [{ ...payment, id: cryptoId() }],
  ].flat();

  const participant: Participant = {
    ...participantsStore[index],
    history: updatedHistory,
    status: deriveStatus(updatedHistory),
  };

  participantsStore = [
    ...participantsStore.slice(0, index),
    participant,
    ...participantsStore.slice(index + 1),
  ];

  return participant;
}

const deriveStatus = (history?: PaymentHistoryEntry[]): PaymentStatus => {
  if (!history || history.length === 0) {
    return 'Atrasado';
  }

  const latest = [...history].sort(
    (a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime(),
  )[0];

  if (latest.status === 'Pago') {
    return 'Em dia';
  }
  return latest.status;
};

const parseDate = (date: string): Date => {
  const [day, month, year] = date.split('/').map((value) => Number(value));
  return new Date(year, month - 1, day);
};
