import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseMessage, DeliveryStatus } from '../types/DittoTypes';

interface MessageStatusProps {
  message: BaseMessage;
  showDetails?: boolean;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({ 
  message, 
  showDetails = false 
}) => {
  const getStatusIcon = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'sent': return '📤';
      case 'delivered': return '✅';
      case 'failed': return '❌';
      case 'expired': return '⏰';
      default: return '❓';
    }
  };

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'sent': return '#007AFF';
      case 'delivered': return '#34C759';
      case 'failed': return '#FF3B30';
      case 'expired': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const deliveredCount = message.acknowledgements.filter(
    ack => ack.status === 'delivered'
  ).length;

  const readCount = message.acknowledgements.filter(
    ack => ack.status === 'read'
  ).length;

  return (
    <View style={styles.container}>
      <Text style={[styles.statusIcon, { color: getStatusColor(message.deliveryStatus) }]}>
        {getStatusIcon(message.deliveryStatus)}
      </Text>
      
      {showDetails && (
        <View style={styles.details}>
          <Text style={styles.statusText}>
            {message.deliveryStatus}
          </Text>
          
          {message.acknowledgements.length > 0 && (
            <Text style={styles.ackText}>
              📨 {deliveredCount} • 👁 {readCount}
            </Text>
          )}
          
          {message.retryCount > 0 && (
            <Text style={styles.retryText}>
              🔄 {message.retryCount}/3
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusIcon: {
    fontSize: 12,
  },
  details: {
    marginLeft: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  ackText: {
    fontSize: 10,
    color: '#8E8E93',
  },
  retryText: {
    fontSize: 10,
    color: '#FF9500',
  },
});
