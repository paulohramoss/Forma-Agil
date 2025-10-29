import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Provider as PaperProvider, Appbar, Card, Text, Button, Chip, ProgressBar } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

const finances = {
  totalGoal: 85000,
  collected: 38000,
  pending: 47000,
  nextDeadline: '15/08/2024',
};

const participants = [
  { name: 'Ana Souza', status: 'Pago', value: 1200 },
  { name: 'Bruno Lima', status: 'Atrasado', value: 900 },
  { name: 'Carla Mendes', status: 'Em dia', value: 1050 },
];

const poll = {
  question: 'Qual banda devemos contratar para a festa?',
  options: [
    { label: 'Banda Aurora', votes: 38 },
    { label: 'DJ Set Formandos', votes: 22 },
    { label: 'Grupo Samba&Som', votes: 17 },
  ],
};

export default function App() {
  return (
    <PaperProvider>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Forma Ágil" subtitle="Painel da comissão" />
        </Appbar.Header>
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.card}>
            <Card.Title title="Resumo financeiro" subtitle={`Meta: R$ ${finances.totalGoal.toLocaleString('pt-BR')}`} />
            <Card.Content>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text variant="titleMedium">Total arrecadado</Text>
                  <Text variant="headlineMedium" style={styles.positiveText}>
                    R$ {finances.collected.toLocaleString('pt-BR')}
                  </Text>
                </View>
                <View style={styles.column}>
                  <Text variant="titleMedium">Pendente</Text>
                  <Text variant="headlineMedium" style={styles.warningText}>
                    R$ {finances.pending.toLocaleString('pt-BR')}
                  </Text>
                </View>
              </View>
              <ProgressBar
                progress={finances.collected / finances.totalGoal}
                color="#00875A"
                style={styles.progress}
              />
              <Chip icon="calendar" style={styles.chip}>
                Próximo vencimento: {finances.nextDeadline}
              </Chip>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Status dos formandos" subtitle="Cobranças e pagamentos" />
            <Card.Content>
              {participants.map((participant) => (
                <View key={participant.name} style={styles.participantRow}>
                  <View>
                    <Text variant="titleMedium">{participant.name}</Text>
                    <Text variant="bodyMedium">Valor: R$ {participant.value.toLocaleString('pt-BR')}</Text>
                  </View>
                  <Chip icon={participant.status === 'Pago' ? 'check-circle' : 'alert'}>
                    {participant.status}
                  </Chip>
                </View>
              ))}
              <Button mode="contained" icon="whatsapp" style={styles.button}>
                Enviar lembretes automáticos
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Enquete em andamento" subtitle={poll.question} />
            <Card.Content>
              {poll.options.map((option) => (
                <View key={option.label} style={styles.pollOption}>
                  <Text variant="titleMedium">{option.label}</Text>
                  <ProgressBar progress={option.votes / 100} style={styles.pollProgress} />
                  <Text variant="bodyMedium">{option.votes} votos</Text>
                </View>
              ))}
              <Button mode="outlined" icon="chart-bar" style={styles.button}>
                Ver detalhes da votação
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  column: {
    flex: 1,
  },
  progress: {
    height: 8,
    borderRadius: 4,
  },
  chip: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
  },
  pollOption: {
    marginBottom: 12,
  },
  pollProgress: {
    marginVertical: 4,
  },
  positiveText: {
    color: '#00875A',
  },
  warningText: {
    color: '#C75A00',
  },
});
