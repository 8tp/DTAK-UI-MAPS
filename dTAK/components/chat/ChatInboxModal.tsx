import React, { useEffect, useMemo, useState } from "react";
import {
	FlatList,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { GiftedChat, IMessage, User } from "react-native-gifted-chat";
import { SafeAreaView } from "react-native-safe-area-context";

export type MinimalUser = Pick<User, "_id" | "name" | "avatar">;

export type ChatThread = {
	id: string;
	title: string;
	peer: MinimalUser;
	messages: IMessage[];
};

export type ChatInboxModalProps = {
	visible: boolean;
	onDismiss: () => void;
	currentUser: MinimalUser;
	threads: ChatThread[];
	onSend?: (threadId: string, messages: IMessage[]) => void;
	headerTitle?: string;
};

/**
 * Chat inbox modal that lists all peer conversations and renders the selected
 * thread with GiftedChat.
 */
export default function ChatInboxModal({
	visible,
	onDismiss,
	currentUser,
	threads,
	onSend,
	headerTitle = "Mission Chats",
}: ChatInboxModalProps) {
	const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

	useEffect(() => {
		if (!visible) {
			setActiveThreadId(null);
		}
	}, [visible]);

	useEffect(() => {
		if (activeThreadId && !threads.some((thread) => thread.id === activeThreadId)) {
			setActiveThreadId(null);
		}
	}, [threads, activeThreadId]);

	const activeThread = useMemo(
		() => threads.find((thread) => thread.id === activeThreadId) ?? null,
		[activeThreadId, threads],
	);

	const sortedThreads = useMemo(() => {
		return [...threads].sort((a, b) => {
			const aDate = a.messages[0]?.createdAt ? new Date(a.messages[0].createdAt).getTime() : 0;
			const bDate = b.messages[0]?.createdAt ? new Date(b.messages[0].createdAt).getTime() : 0;
			return bDate - aDate;
		});
	}, [threads]);

	const renderThreadItem = ({ item }: { item: ChatThread }) => {
		const latest = item.messages[0];
		const subtitle = latest?.text ?? "No messages yet";
		const timestamp = latest?.createdAt
			? new Date(latest.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
			: null;

		return (
			<Pressable style={styles.threadRow} onPress={() => setActiveThreadId(item.id)}>
				<View style={styles.threadAvatar}>
					<Text style={styles.threadAvatarLabel}>
						{item.peer.name ? item.peer.name.charAt(0).toUpperCase() : "?"}
					</Text>
				</View>
				<View style={styles.threadContent}>
					<Text style={styles.threadTitle}>{item.title}</Text>
					<Text style={styles.threadSubtitle} numberOfLines={1}>
						{subtitle}
					</Text>
				</View>
				{timestamp ? <Text style={styles.threadTimestamp}>{timestamp}</Text> : null}
			</Pressable>
		);
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="fullScreen"
			onRequestClose={onDismiss}>
			<SafeAreaView
				style={styles.modalContainer}
				edges={Platform.select({ ios: ["top", "bottom"], default: ["bottom"] })}>
				<View style={styles.header}>
					<Text style={styles.title}>{activeThread ? activeThread.title : headerTitle}</Text>
					<TouchableOpacity onPress={activeThread ? () => setActiveThreadId(null) : onDismiss}>
						<Text style={styles.headerAction}>{activeThread ? "Back" : "Close"}</Text>
					</TouchableOpacity>
				</View>

				{!activeThread ? (
					<FlatList
						data={sortedThreads}
						keyExtractor={(item) => item.id}
						renderItem={renderThreadItem}
						ItemSeparatorComponent={() => <View style={styles.separator} />}
						contentContainerStyle={sortedThreads.length === 0 ? styles.emptyStateContainer : undefined}
						ListEmptyComponent={() => (
							<View style={styles.emptyState}>
								<Text style={styles.emptyStateTitle}>No conversations yet</Text>
								<Text style={styles.emptyStateSubtitle}>
									Start a new chat to see it appear here.
								</Text>
							</View>
						)}
					/>
				) : (
					<View style={styles.chatContainer}>
						<GiftedChat
							messages={activeThread.messages}
							onSend={(msgs) => onSend?.(activeThread.id, msgs)}
							user={currentUser}
							placeholder="Type a message..."
							keyboardShouldPersistTaps="handled"
							renderAvatarOnTop
							renderUsernameOnMessage
							showUserAvatar
							maxInputLength={250}
						/>
					</View>
				)}
			</SafeAreaView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		backgroundColor: "#121212",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "#2E3238",
	},
	title: {
		fontSize: 18,
		fontWeight: "600",
		color: "#FFFFFF",
	},
	headerAction: {
		color: "#4F9DF0",
		fontSize: 16,
	},
	chatContainer: {
		flex: 1,
		backgroundColor: "#1B1E22",
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: "#1F2428",
		marginLeft: 72,
	},
	threadRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 14,
		backgroundColor: "#1B1E22",
	},
	threadAvatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: "#2F3439",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	threadAvatarLabel: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "600",
	},
	threadContent: {
		flex: 1,
	},
	threadTitle: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 2,
	},
	threadSubtitle: {
		color: "#A0A7AD",
		fontSize: 14,
	},
	threadTimestamp: {
		color: "#6C7379",
		fontSize: 12,
		marginLeft: 8,
	},
	emptyStateContainer: {
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	emptyState: {
		alignItems: "center",
	},
	emptyStateTitle: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 8,
	},
	emptyStateSubtitle: {
		color: "#A0A7AD",
		fontSize: 14,
		textAlign: "center",
	},
});
