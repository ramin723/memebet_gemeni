import { ref, computed, watch, onMounted, onUnmounted, readonly, nextTick } from 'vue';
import { useRouter } from 'vue-router';

// Types
interface Command {
  id: string;
  title: string;
  description?: string;
  icon: string;
  shortcut?: string; //  <-- FIX 1: Add shortcut back as an optional property
  action: () => void;
  category: string;
}

interface UserSearchResult {
  id: string;
  username: string | null;
  wallet_address: string;
}

interface ApiUserResponse {
  data: {
    users: UserSearchResult[];
  }
}

export const useCommandPalette = () => {
  const router = useRouter();
  const isOpen = ref(false);
  const search = ref('');
  const selectedIndex = ref(0);
  const isLoading = ref(false);
  const searchResults = ref<UserSearchResult[]>([]);

  const staticCommands: Command[] = [
    { id: 'dashboard', title: 'داشبورد', description: 'بازگشت به صفحه اصلی', icon: 'i-heroicons-home', action: () => router.push('/admin'), category: 'ناوبری' },
    { id: 'users', title: 'کاربران', description: 'مدیریت کاربران سیستم', icon: 'i-heroicons-users', action: () => router.push('/admin/users'), category: 'ناوبری' },
    // Add more static commands here...
  ];

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      searchResults.value = [];
      return;
    }
    isLoading.value = true;
    try {
      // استفاده از هدرهای احراز هویت جدید
      const response = await $fetch<ApiUserResponse>('/api/admin/users', { 
        params: { search: query, limit: 5 },
        headers: {
          'x-dev-user-wallet': 'wallet_superadmin'
        }
      });
      searchResults.value = response.data.users || [];
    } catch (error) {
      console.error('Error searching users:', error);
      searchResults.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const allCommands = computed((): Command[] => {
    const userCommands: Command[] = searchResults.value.map(user => ({
      id: `user-${user.id}`,
      title: user.username || 'کاربر بی‌نام',
      description: `کیف پول: ${user.wallet_address.slice(0, 8)}...`,
      icon: 'i-heroicons-user',
      action: () => router.push(`/admin/users/${user.id}`),
      category: 'کاربران'
    }));
    return [...staticCommands, ...userCommands];
  });

  // FIX 2: Re-introduce filteredCommands for the Vue component to use
  const filteredCommands = computed(() => {
      if (!search.value) {
          return staticCommands;
      }
      const query = search.value.toLowerCase();
      return allCommands.value.filter(command => 
          command.title.toLowerCase().includes(query) ||
          command.description?.toLowerCase().includes(query)
      );
  });

  const groupedCommands = computed(() => {
    return filteredCommands.value.reduce((groups, command) => {
        const category = command.category;
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(command);
        return groups;
    }, {} as Record<string, Command[]>);
  });

  const closePalette = () => {
    isOpen.value = false;
    search.value = '';
    selectedIndex.value = 0;
    searchResults.value = [];
  };

  const togglePalette = () => isOpen.value ? closePalette() : isOpen.value = true;

  const executeSelected = () => {
    const command = filteredCommands.value[selectedIndex.value];
    if (command) {
      command.action();
      closePalette();
    }
  };

  const selectNext = () => {
    if (filteredCommands.value.length > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % filteredCommands.value.length;
    }
  };
  const selectPrevious = () => {
    if (filteredCommands.value.length > 0) {
      selectedIndex.value = (selectedIndex.value - 1 + filteredCommands.value.length) % filteredCommands.value.length;
    }
  };

  watch(search, (newValue) => {
    selectedIndex.value = 0;
    searchUsers(newValue);
  });

  const handleKeydown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      togglePalette();
    }
    if (event.key === 'Escape' && isOpen.value) {
        closePalette();
    }
  };

  onMounted(() => document.addEventListener('keydown', handleKeydown));
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown));

  return {
    isOpen: readonly(isOpen),
    search,
    selectedIndex,
    isLoading,
    groupedCommands,
    filteredCommands, // <-- FIX 3: Return filteredCommands
    open: () => isOpen.value = true,
    close: closePalette,
    toggle: togglePalette,
    executeSelected,
    selectNext,
    selectPrevious
  };
};