import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import {
  Provider as PaperProvider,
  Appbar,
  BottomNavigation,
  Card,
  Text,
  Button,
  Chip,
  ProgressBar,
  List,
  Divider,
  Portal,
  Dialog,
  TextInput,
  HelperText,
  SegmentedButtons,
  Snackbar,
  ActivityIndicator,
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import {
  addParticipant,
  getCommunicationFeed,
  getFinanceSummary,
  getParticipants,
  getPoll,
  importParticipants,
  type CommunicationMessage,
  type FinanceSummary,
  type Participant,
  type ParticipantInput,
  type PaymentStatus,
  type Poll,
} from './src/services/mockApi';

const sampleImportPayload: ParticipantInput[] = [
  {
    name: 'Diego Alves',
    value: 1300,
    whatsapp: '55 11 97654-3210',
    history: [
      { date: '05/01/2024', amount: 650, status: 'Pago', method: 'PIX' },
      { date: '05/02/2024', amount: 650, status: 'Pago', method: 'PIX' },
    ],
  },
  {
    name: 'Fernanda Costa',
    value: 1400,
    whatsapp: '55 11 96543-2100',
    history: [
      { date: '03/01/2024', amount: 700, status: 'Pago', method: 'Cartao' },
      { date: '03/02/2024', amount: 700, status: 'Atrasado', method: 'Cartao' },
    ],
  },
];

const initialParticipantForm = {
  name: '',
  value: '',
  whatsapp: '',
  paymentAmount: '',
  paymentDate: '',
  paymentStatus: 'Pago' as PaymentStatus,
};

type SnackbarState = {
  visible: boolean;
  message: string;
  tone: 'success' | 'error';
};

const navigationRoutes = [
  { key: 'finances', title: 'Financas', focusedIcon: 'cash' },
  { key: 'polls', title: 'Enquetes', focusedIcon: 'poll' },
  { key: 'communication', title: 'Comunicacao', focusedIcon: 'message-text' },
];

const statusColorMap: Record<PaymentStatus, string> = {
  Pago: '#00875A',
  'Em dia': '#2E7D32',
  Atrasado: '#C75A00',
};

const channelIconMap: Record<CommunicationMessage['channel'], string> = {
  WhatsApp: 'whatsapp',
  Email: 'email',
  App: 'cellphone-text',
};

const formatCurrencyBRL = (value: number) => {
  const [integer, decimal] = value.toFixed(2).split('.');
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${formattedInteger},${decimal}`;
};

const parseCurrencyValue = (value: string) => {
  const sanitized = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const formatPercentage = (value: number, fractionDigits = 0) => {
  const percentage = Math.max(0, Math.min(1, value)) * 100;
  return `${percentage.toFixed(fractionDigits)}%`;
};

type FinancesTabProps = {
  loading: boolean;
  financeSummary: FinanceSummary | null;
  participants: Participant[];
  onAddParticipantPress: () => void;
  onImportPress: () => void;
  importing: boolean;
};

type PollsTabProps = {
  loading: boolean;
  poll: Poll | null;
};

type CommunicationTabProps = {
  loading: boolean;
  messages: CommunicationMessage[];
};

const getStatusChipStyle = (status: PaymentStatus) => ({
  backgroundColor: statusColorMap[status],
});

export default function App() {
  const [index, setIndex] = useState(0);
  const [routes] = useState(navigationRoutes);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [savingParticipant, setSavingParticipant] = useState(false);
  const [importing, setImporting] = useState(false);
  const [snackbarState, setSnackbarState] = useState<SnackbarState>({
    visible: false,
    message: '',
    tone: 'success',
  });
  const [participantForm, setParticipantForm] = useState(initialParticipantForm);
  const [formErrors, setFormErrors] = useState<{ name?: string; value?: string; paymentAmount?: string }>({});

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [summary, participantList, pollData, communication] = await Promise.all([
          getFinanceSummary(),
          getParticipants(),
          getPoll(),
          getCommunicationFeed(),
        ]);
        if (!isMounted) {
          return;
        }
        setFinanceSummary(summary);
        setParticipants(participantList);
        setPoll(pollData);
        setMessages(communication);
      } catch (error) {
        if (isMounted) {
          setSnackbarState({
            visible: true,
            message: 'Nao foi possivel carregar os dados iniciais.',
            tone: 'error',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [summary, participantList, pollData, communication] = await Promise.all([
        getFinanceSummary(),
        getParticipants(),
        getPoll(),
        getCommunicationFeed(),
      ]);
      setFinanceSummary(summary);
      setParticipants(participantList);
      setPoll(pollData);
      setMessages(communication);
      setSnackbarState({ visible: true, message: 'Dados atualizados.', tone: 'success' });
    } catch (error) {
      setSnackbarState({
        visible: true,
        message: 'Nao foi possivel atualizar os dados.',
        tone: 'error',
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleParticipantSubmit = useCallback(async () => {
    const trimmedName = participantForm.name.trim();
    const totalValue = parseCurrencyValue(participantForm.value);
    const errors: { name?: string; value?: string; paymentAmount?: string } = {};

    if (!trimmedName) {
      errors.name = 'Informe o nome completo.';
    }

    if (!totalValue || Number.isNaN(totalValue) || totalValue <= 0) {
      errors.value = 'Informe um valor total valido.';
    }

    let history: ParticipantInput['history'];
    if (participantForm.paymentAmount.trim()) {
      const amountValue = parseCurrencyValue(participantForm.paymentAmount);
      if (!amountValue || Number.isNaN(amountValue) || amountValue <= 0) {
        errors.paymentAmount = 'Informe um valor valido para a primeira parcela.';
      } else {
        const paymentDate = participantForm.paymentDate.trim() || new Date().toLocaleDateString('pt-BR');
        history = [
          {
            date: paymentDate,
            amount: amountValue,
            status: participantForm.paymentStatus,
            method: 'Cadastro manual',
          },
        ];
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSavingParticipant(true);
    try {
      const created = await addParticipant({
        name: trimmedName,
        value: totalValue,
        whatsapp: participantForm.whatsapp.trim() || undefined,
        history,
      });
      setParticipants((current) => [...current, created]);
      const summary = await getFinanceSummary();
      setFinanceSummary(summary);
      setDialogVisible(false);
      setParticipantForm(initialParticipantForm);
      setSnackbarState({ visible: true, message: 'Formando cadastrado.', tone: 'success' });
    } catch (error) {
      setSnackbarState({
        visible: true,
        message: 'Nao foi possivel cadastrar o formando.',
        tone: 'error',
      });
    } finally {
      setSavingParticipant(false);
    }
  }, [participantForm]);

  const handleImportSample = useCallback(async () => {
    setImporting(true);
    try {
      const imported = await importParticipants(sampleImportPayload);
      setParticipants((current) => [...current, ...imported]);
      const summary = await getFinanceSummary();
      setFinanceSummary(summary);
      setSnackbarState({
        visible: true,
        message: `${imported.length} registros importados da planilha modelo.`,
        tone: 'success',
      });
    } catch (error) {
      setSnackbarState({
        visible: true,
        message: 'Nao foi possivel importar os dados simulados.',
        tone: 'error',
      });
    } finally {
      setImporting(false);
    }
  }, []);

  const handleDialogDismiss = useCallback(() => {
    if (savingParticipant) {
      return;
    }
    setDialogVisible(false);
    setParticipantForm(initialParticipantForm);
    setFormErrors({});
  }, [savingParticipant]);

  const renderScene = useCallback(
    ({ route }: { route: { key: string } }) => {
      switch (route.key) {
        case 'finances':
          return (
            <FinancesTab
              loading={loading}
              financeSummary={financeSummary}
              participants={participants}
              onAddParticipantPress={() => setDialogVisible(true)}
              onImportPress={handleImportSample}
              importing={importing}
            />
          );
        case 'polls':
          return <PollsTab loading={loading} poll={poll} />;
        case 'communication':
          return <CommunicationTab loading={loading} messages={messages} />;
        default:
          return null;
      }
    },
    [financeSummary, handleImportSample, importing, loading, messages, participants, poll],
  );

  const snackbarStyle = snackbarState.tone === 'error' ? styles.snackbarError : styles.snackbarSuccess;

  return (
    <PaperProvider>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.safeArea}>
        <Appbar.Header>
          <Appbar.Content title="Forma Agil" subtitle="Painel da comissao" />
          <Appbar.Action icon="refresh" onPress={refreshAll} disabled={refreshing || loading} />
        </Appbar.Header>
        <View style={styles.navigationContainer}>
          <BottomNavigation
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={renderScene}
            sceneAnimationEnabled
          />
        </View>
        <Portal>
          <Dialog visible={dialogVisible} onDismiss={handleDialogDismiss}>
            <Dialog.Title>Cadastrar formando</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Nome completo"
                value={participantForm.name}
                onChangeText={(value) => setParticipantForm((prev) => ({ ...prev, name: value }))}
                style={styles.dialogField}
                error={Boolean(formErrors.name)}
              />
              {formErrors.name ? (
                <HelperText type="error">{formErrors.name}</HelperText>
              ) : null}
              <TextInput
                label="Valor total previsto"
                value={participantForm.value}
                onChangeText={(value) => setParticipantForm((prev) => ({ ...prev, value }))}
                keyboardType="numeric"
                style={styles.dialogField}
                error={Boolean(formErrors.value)}
              />
              {formErrors.value ? (
                <HelperText type="error">{formErrors.value}</HelperText>
              ) : null}
              <TextInput
                label="Contato WhatsApp (opcional)"
                value={participantForm.whatsapp}
                onChangeText={(value) => setParticipantForm((prev) => ({ ...prev, whatsapp: value }))}
                style={styles.dialogField}
              />
              <Divider style={styles.dialogField} />
              <Text variant="titleSmall">Pagamento inicial (opcional)</Text>
              <TextInput
                label="Valor da primeira parcela"
                value={participantForm.paymentAmount}
                onChangeText={(value) => setParticipantForm((prev) => ({ ...prev, paymentAmount: value }))}
                keyboardType="numeric"
                style={styles.dialogField}
                error={Boolean(formErrors.paymentAmount)}
              />
              {formErrors.paymentAmount ? (
                <HelperText type="error">{formErrors.paymentAmount}</HelperText>
              ) : null}
              <TextInput
                label="Data do pagamento"
                value={participantForm.paymentDate}
                onChangeText={(value) => setParticipantForm((prev) => ({ ...prev, paymentDate: value }))}
                placeholder="dd/mm/aaaa"
                style={styles.dialogField}
              />
              <SegmentedButtons
                style={styles.segmentedButtons}
                value={participantForm.paymentStatus}
                onValueChange={(value) =>
                  setParticipantForm((prev) => ({ ...prev, paymentStatus: value as PaymentStatus }))
                }
                buttons={[
                  { value: 'Pago', label: 'Pago' },
                  { value: 'Em dia', label: 'Em dia' },
                  { value: 'Atrasado', label: 'Atrasado' },
                ]}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handleDialogDismiss}>Cancelar</Button>
              <Button onPress={handleParticipantSubmit} loading={savingParticipant} disabled={savingParticipant}>
                Salvar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        <Snackbar
          visible={snackbarState.visible}
          onDismiss={() => setSnackbarState((prev) => ({ ...prev, visible: false }))}
          duration={4000}
          style={snackbarStyle}
        >
          {snackbarState.message}
        </Snackbar>
      </SafeAreaView>
    </PaperProvider>
  );
}

const FinancesTab: React.FC<FinancesTabProps> = ({
  loading,
  financeSummary,
  participants,
  onAddParticipantPress,
  onImportPress,
  importing,
}) => {
  const [expanded, setExpanded] = useState<string | undefined>();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Carregando dados financeiros...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {financeSummary ? (
        <Card style={styles.card}>
          <Card.Title
            title="Resumo financeiro"
            subtitle={`Meta: ${formatCurrencyBRL(financeSummary.totalGoal)}`}
          />
          <Card.Content>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text variant="labelMedium" style={styles.summaryLabel}>
                  Meta total
                </Text>
                <Text variant="titleLarge">{formatCurrencyBRL(financeSummary.totalGoal)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="labelMedium" style={styles.summaryLabel}>
                  Total arrecadado
                </Text>
                <Text variant="titleLarge" style={styles.positiveText}>
                  {formatCurrencyBRL(financeSummary.collected)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="labelMedium" style={styles.summaryLabel}>
                  Pendente
                </Text>
                <Text variant="titleLarge" style={styles.warningText}>
                  {formatCurrencyBRL(financeSummary.pending)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="labelMedium" style={styles.summaryLabel}>
                  % da meta
                </Text>
                <Text variant="titleLarge">{formatPercentage(financeSummary.fulfilledPercentage)}</Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={
                  financeSummary.totalGoal ? financeSummary.collected / financeSummary.totalGoal : 0
                }
                color="#00875A"
                style={styles.progress}
              />
              <Text variant="bodySmall" style={styles.progressLabel}>
                {formatPercentage(financeSummary.fulfilledPercentage, 1)} da meta atingida
              </Text>
            </View>
            <Chip icon="calendar" style={styles.chip}>
              Proximo vencimento: {financeSummary.nextDeadline}
            </Chip>
            <Text variant="bodySmall" style={styles.updatedText}>
              Atualizado em {financeSummary.lastUpdated}
            </Text>
            <Text variant="titleSmall" style={styles.sectionSpacing}>
              Ultimas movimentacoes
            </Text>
            {financeSummary.latestPayments.length === 0 ? (
              <Text variant="bodyMedium">Nenhum pagamento registrado.</Text>
            ) : (
              financeSummary.latestPayments.map((entry) => {
                const details = [entry.note, entry.method ?? 'Metodo nao informado']
                  .filter(Boolean)
                  .join(' • ');
                return (
                  <List.Item
                    key={entry.id}
                    title={`${entry.date} - ${entry.status}`}
                    description={details}
                    right={() => (
                      <Text style={styles.amountText}>{formatCurrencyBRL(entry.amount)}</Text>
                    )}
                  />
                );
              })
            )}
          </Card.Content>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Card.Title title="Cadastro rapido" subtitle="Adicione novos formandos" />
        <Card.Content>
          <Button
            mode="contained"
            onPress={onAddParticipantPress}
            style={styles.cardButton}
            icon="account-plus"
          >
            Cadastrar formando
          </Button>
          <Button
            mode="outlined"
            onPress={onImportPress}
            style={styles.cardButton}
            icon="tray-arrow-down"
            loading={importing}
            disabled={importing}
          >
            Importar lista simulada
          </Button>
          <Text variant="bodySmall" style={styles.helperText}>
            A importacao usa dados ficticios em memoria para simular a leitura de planilhas.
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Formandos e pagamentos"
          subtitle={`${participants.length} registros`}
        />
        <Card.Content>
          {participants.length === 0 ? (
            <Text variant="bodyMedium">Nenhum formando cadastrado ate o momento.</Text>
          ) : (
            <List.AccordionGroup
              expandedId={expanded}
              onAccordionPress={(id) => setExpanded(id as string | undefined)}
            >
              {participants.map((participant) => (
                <List.Accordion
                  key={participant.id}
                  id={participant.id}
                  title={participant.name}
                  description={`${formatCurrencyBRL(participant.value)} - Status: ${participant.status}${
                    participant.whatsapp ? `\nWhatsApp: ${participant.whatsapp}` : ''
                  }`}
                  left={(props) => <List.Icon {...props} icon="account" />}
                  right={() => (
                    <Chip
                      compact
                      style={[styles.statusChip, getStatusChipStyle(participant.status)]}
                      textStyle={styles.statusChipText}
                    >
                      {participant.status}
                    </Chip>
                  )}
                >
                  <View style={styles.participantMeta}>
                    <Chip icon="cash" compact style={styles.participantChip}>
                      Total: {formatCurrencyBRL(participant.value)}
                    </Chip>
                    {participant.whatsapp ? (
                      <Chip icon="whatsapp" compact style={styles.participantChip}>
                        {participant.whatsapp}
                      </Chip>
                    ) : null}
                  </View>
                  {participant.history.length === 0 ? (
                    <Text variant="bodyMedium" style={styles.sectionSpacing}>
                      Nenhum pagamento registrado para este formando.
                    </Text>
                  ) : (
                    participant.history.map((entry) => (
                      <View key={entry.id}>
                        <List.Item
                          title={`${entry.date} - ${entry.status}`}
                          description={entry.method ?? 'Metodo nao informado'}
                          left={(props) => <List.Icon {...props} icon="cash" />}
                          right={() => (
                            <Text style={styles.amountText}>{formatCurrencyBRL(entry.amount)}</Text>
                          )}
                        />
                        <Divider />
                      </View>
                    ))
                  )}
                </List.Accordion>
              ))}
            </List.AccordionGroup>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const PollsTab: React.FC<PollsTabProps> = ({ loading, poll }) => {
  if (loading && !poll) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Carregando enquete...
        </Text>
      </View>
    );
  }

  if (!poll) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="bodyMedium">Nenhuma enquete ativa no momento.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Card style={styles.card}>
        <Card.Title
          title="Enquete ativa"
          subtitle={`${poll.totalVotes} votos registrados`}
        />
        <Card.Content>
          <Text variant="titleMedium">{poll.question}</Text>
          {poll.options.map((option) => {
            const progress = poll.totalVotes ? option.votes / poll.totalVotes : 0;
            return (
              <View key={option.id} style={styles.pollOption}>
                <View style={styles.pollHeader}>
                  <Text variant="titleSmall">{option.label}</Text>
                  <View style={styles.pollMeta}>
                    <Chip compact>{`${option.votes} votos`}</Chip>
                    <Text variant="bodySmall" style={styles.pollPercent}>
                      {formatPercentage(progress, 1)}
                    </Text>
                  </View>
                </View>
                <ProgressBar progress={progress} style={styles.pollProgress} />
              </View>
            );
          })}
          <Chip icon="calendar" style={styles.chip}>
            Encerra em {poll.closesAt}
          </Chip>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const CommunicationTab: React.FC<CommunicationTabProps> = ({ loading, messages }) => {
  if (loading && messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Carregando comunicacoes...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Card style={styles.card}>
        <Card.Title
          title="Fila de comunicacao"
          subtitle={`${messages.length} mensagens`}
        />
        <Card.Content>
          {messages.length === 0 ? (
            <Text variant="bodyMedium">Nenhuma comunicacao cadastrada.</Text>
          ) : (
            messages.map((message) => (
              <View key={message.id} style={styles.messageSpacer}>
                <List.Item
                  title={message.title}
                  description={`${message.audience} - ${message.scheduledFor}`}
                  left={(props) => <List.Icon {...props} icon={channelIconMap[message.channel]} />}
                  right={() => (
                    <Chip compact style={styles.messageStatus}>
                      {message.status}
                    </Chip>
                  )}
                />
                <Text variant="bodySmall">{message.body}</Text>
                <Divider style={styles.messageSpacer} />
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  navigationContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginTop: 4,
    marginBottom: 4,
  },
  summaryItem: {
    backgroundColor: '#EEF3F8',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginBottom: 12,
    flexGrow: 1,
    minWidth: '45%',
  },
  summaryLabel: {
    color: '#5E6A75',
    marginBottom: 8,
  },
  chip: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  cardButton: {
    marginTop: 12,
  },
  helperText: {
    marginTop: 8,
    color: '#5E6A75',
  },
  progressContainer: {
    marginTop: 4,
    marginBottom: 16,
  },
  progress: {
    height: 8,
    borderRadius: 4,
  },
  progressLabel: {
    marginTop: 8,
    color: '#5E6A75',
  },
  amountText: {
    alignSelf: 'center',
    fontWeight: '600',
  },
  updatedText: {
    marginTop: 8,
    color: '#5E6A75',
  },
  loadingContainer: {
    flex: 1,
    paddingTop: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  pollOption: {
    marginTop: 12,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    alignItems: 'center',
  },
  pollMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollPercent: {
    marginLeft: 8,
    color: '#5E6A75',
  },
  pollProgress: {
    height: 8,
    borderRadius: 4,
  },
  messageStatus: {
    alignSelf: 'center',
  },
  messageSpacer: {
    marginVertical: 8,
  },
  snackbarSuccess: {
    backgroundColor: '#0E7C86',
  },
  snackbarError: {
    backgroundColor: '#C75A00',
  },
  dialogField: {
    marginTop: 12,
  },
  segmentedButtons: {
    marginTop: 12,
  },
  statusChip: {
    marginVertical: 4,
  },
  statusChipText: {
    color: '#FFFFFF',
  },
  sectionSpacing: {
    marginTop: 12,
  },
  participantMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 12,
  },
  participantChip: {
    marginRight: 8,
    marginTop: 4,
  },
  positiveText: {
    color: '#00875A',
  },
  warningText: {
    color: '#C75A00',
  },
});
