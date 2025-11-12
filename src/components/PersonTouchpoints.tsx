import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../theme';
import { Touchpoint } from '../types/api';
import { Ionicons } from '@expo/vector-icons';

interface PersonTouchpointsProps {
  touchpoints?: Touchpoint[];
}

export const PersonTouchpoints: React.FC<PersonTouchpointsProps> = ({ touchpoints }) => {
  const [showAll, setShowAll] = useState(false);

  if (!touchpoints || touchpoints.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Touchpoints</Text>
        <Text style={styles.noDataText}>No touchpoints recorded</Text>
      </View>
    );
  }

  const displayedTouchpoints = showAll ? touchpoints.slice(0, 20) : touchpoints.slice(0, 5);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const getIconForAction = (action: string) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('login') || actionLower.includes('logged')) {
      return 'log-in';
    } else if (actionLower.includes('event') || actionLower.includes('attend')) {
      return 'calendar';
    } else if (actionLower.includes('email') || actionLower.includes('mail')) {
      return 'mail';
    } else if (actionLower.includes('profile') || actionLower.includes('account')) {
      return 'person';
    } else if (actionLower.includes('member')) {
      return 'card';
    } else if (actionLower.includes('purchase') || actionLower.includes('bought')) {
      return 'cart';
    } else if (actionLower.includes('download')) {
      return 'download';
    } else if (actionLower.includes('register')) {
      return 'create';
    } else if (actionLower.includes('support') || actionLower.includes('help')) {
      return 'help-circle';
    } else if (actionLower.includes('course') || actionLower.includes('learn')) {
      return 'school';
    } else if (actionLower.includes('volunteer')) {
      return 'hand-left';
    } else if (actionLower.includes('donat')) {
      return 'heart';
    } else if (actionLower.includes('share') || actionLower.includes('social')) {
      return 'share-social';
    } else {
      return 'ellipse';
    }
  };

  const getColorForAction = (action: string) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('login') || actionLower.includes('logged')) {
      return '#f58676';
    } else if (actionLower.includes('event') || actionLower.includes('attend')) {
      return '#FF3B30';
    } else if (actionLower.includes('email') || actionLower.includes('mail')) {
      return '#FF9500';
    } else if (actionLower.includes('profile') || actionLower.includes('account')) {
      return '#5856D6';
    } else if (actionLower.includes('member')) {
      return '#4CD964';
    } else if (actionLower.includes('purchase') || actionLower.includes('bought')) {
      return '#607D8B';
    } else if (actionLower.includes('download')) {
      return '#00BCD4';
    } else if (actionLower.includes('register')) {
      return '#009688';
    } else if (actionLower.includes('support') || actionLower.includes('help')) {
      return '#9C27B0';
    } else if (actionLower.includes('course') || actionLower.includes('learn')) {
      return '#FF5722';
    } else if (actionLower.includes('volunteer')) {
      return '#795548';
    } else if (actionLower.includes('donat')) {
      return '#F44336';
    } else if (actionLower.includes('share') || actionLower.includes('social')) {
      return '#3F51B5';
    } else {
      return theme.colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Touchpoints</Text>
      
      {displayedTouchpoints.map((touchpoint) => (
        <View key={touchpoint.id} style={styles.touchpointItem}>
          <View style={[styles.iconContainer, { backgroundColor: getColorForAction(touchpoint.attributes.action) + '20' }]}>
            <Ionicons 
              name={getIconForAction(touchpoint.attributes.action) as any} 
              size={20} 
              color={getColorForAction(touchpoint.attributes.action)} 
            />
          </View>
          
          <View style={styles.touchpointContent}>
            <View style={styles.touchpointHeader}>
              <Text style={styles.actionText}>{touchpoint.attributes.action}</Text>
              <Text style={styles.dateText}>{formatDateTime(touchpoint.attributes.created_at)}</Text>
            </View>
            
            {touchpoint.attributes.details && (
              <Text style={styles.detailsText} numberOfLines={2}>{touchpoint.attributes.details}</Text>
            )}
            
            {touchpoint.attributes.code && (
              <Text style={styles.codeText}>{touchpoint.attributes.code}</Text>
            )}
          </View>
        </View>
      ))}

      {touchpoints.length > 5 && (
        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={() => setShowAll(!showAll)}
        >
          <Text style={styles.toggleButtonText}>
            {showAll 
              ? `Show less` 
              : `Show ${Math.min(15, touchpoints.length - 5)} more`
            }
          </Text>
          <Ionicons 
            name={showAll ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  noDataText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  touchpointItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  touchpointContent: {
    flex: 1,
  },
  touchpointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  codeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginRight: 4,
  },
});