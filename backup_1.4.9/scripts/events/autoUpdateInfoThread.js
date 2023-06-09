module.exports = {
	config: {
		name: "autoUpdateThreadInfo",
		version: "1.3",
		author: "NTKhang",
		category: "events"
	},

	onStart: async ({ threadsData, event, api }) => {
		const types = ["log:subscribe", "log:unsubscribe", "log:thread-admins", "log:thread-name", "log:thread-image", "log:thread-icon", "log:thread-color", "log:user-nickname"];
		if (!types.includes(event.logMessageType))
			return;
		const { threadID, logMessageData, logMessageType } = event;
		const threadInfo = await threadsData.get(event.threadID);
		// eslint-disable-next-line prefer-const
		let { members, adminIDs } = threadInfo;
		switch (logMessageType) {
			case "log:subscribe":
				return async function () {
					const { addedParticipants } = event.logMessageData;
					const threadInfo_Fca = await api.getThreadInfo(threadID);
					threadsData.refreshInfo(threadID, threadInfo_Fca);

					for (const user of addedParticipants) {
						let oldData = members.find(member => member.userID === user.userFbId);
						const isOldMember = oldData ? true : false;
						oldData = oldData || {};
						const { userInfo, nicknames } = threadInfo_Fca;

						const newData = {
							userID: user.userFbId,
							name: user.fullName,
							gender: userInfo.find(u => u.id == user.userFbId)?.gender,
							nickname: nicknames[user.userFbId] || null,
							inGroup: true,
							count: oldData.count || 0
						};

						if (!isOldMember)
							members.push(newData);
						else {
							const index = members.findIndex(member => member.userID === user.userFbId);
							members[index] = newData;
						}
					}
					await threadsData.set(threadID, { members });
				};

			case "log:unsubscribe":
				return async function () {
					const oldData = members.find(member => member.userID === logMessageData.leftParticipantFbId);
					if (oldData) {
						oldData.inGroup = false;
						await threadsData.set(threadID, { members });
					}
				};

			case "log:thread-admins":
				return async function () {
					if (logMessageData.ADMIN_EVENT == "add_admin")
						adminIDs.push(logMessageData.TARGET_ID);
					else
						adminIDs = adminIDs.filter(uid => uid != logMessageData.TARGET_ID);
					adminIDs = [...new Set(adminIDs)];
					await threadsData.set(threadID, { adminIDs });
				};

			case "log:thread-name":
				return async function () {
					const threadName = logMessageData.name;
					await threadsData.set(threadID, { threadName });
				};
			case "log:thread-image":
				return async function () {
					await threadsData.set(threadID, { imageSrc: logMessageData.url });
				};
			case "log:thread-icon":
				return async function () {
					await threadsData.set(threadID, { emoji: logMessageData.thread_icon });
				};
			case "log:thread-color":
				return async function () {
					await threadsData.set(threadID, { threadThemeID: logMessageData.theme_id });
				};
			case "log:user-nickname":
				return async function () {
					const { participant_id, nickname } = logMessageData;
					const oldData = members.find(member => member.userID === participant_id);
					if (oldData) {
						oldData.nickname = nickname;
						await threadsData.set(threadID, { members });
					}
				};
			default:
				return null;
		}

	}
};