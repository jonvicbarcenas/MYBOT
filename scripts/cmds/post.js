const axios = require("axios");

module.exports = {
  config: {
    name: "post",
    aliases: ["posts"],
    version: "1.0",
    author: "JV Barcenas",
    countDown: 5,
    role: 2,
    shortDescription: "post bot timeline",
    longDescription: "post bot tls",
    category: "Utility",
  },

  onStart: async function ({ event, api }) {
    const { threadID, messageID, senderID } = event;
    const uuid = getGUID();
    const formData = {
      "input": {
        "composer_entry_point": "inline_composer",
        "composer_source_surface": "timeline",
        "idempotence_token": uuid + "_FEED",
        "source": "WWW",
        "attachments": [],
        "audience": {
          "privacy": {
            "allow": [],
            "base_state": "FRIENDS", // SELF EVERYONE
            "deny": [],
            "tag_expansion_state": "UNSPECIFIED"
          }
        },
        "message": {
          "ranges": [],
          "text": ""
        },
        "with_tags_ids": [],
        "inline_activities": [],
        "explicit_place_id": "0",
        "text_format_preset_id": "0",
        "logging": {
          "composer_session_id": uuid
        },
        "tracking": [
          null
        ],
        "actor_id": api.getCurrentUserID(),
        "client_mutation_id": Math.floor(Math.random() * 17)
      },
      "displayCommentsFeedbackContext": null,
      "displayCommentsContextEnableComment": null,
      "displayCommentsContextIsAdPreview": null,
      "displayCommentsContextIsAggregatedShare": null,
      "displayCommentsContextIsStorySet": null,
      "feedLocation": "TIMELINE",
      "feedbackSource": 0,
      "focusCommentID": null,
      "gridMediaWidth": 230,
      "groupID": null,
      "scale": 3,
      "privacySelectorRenderLocation": "COMET_STREAM",
      "renderLocation": "timeline",
      "useDefaultActor": false,
      "inviteShortLinkKey": null,
      "isFeed": false,
      "isFundraiser": false,
      "isFunFactPost": false,
      "isGroup": false,
      "isTimeline": true,
      "isSocialLearning": false,
      "isPageNewsFeed": false,
      "isProfileReviews": false,
      "isWorkSharedDraft": false,
      "UFI2CommentsProvider_commentsKey": "ProfileCometTimelineRoute",
      "hashtag": null,
      "canUserManageOffers": false
    };

    return api.sendMessage(
      `Choose an audience that can see this article of yours\n1. Everyone\n2. Friend\n3. Only me`,
      threadID,
      (e, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: senderID,
          formData,
          type: "whoSee",
        });
      },
      messageID
    );
  },

  onReply: async function ({ event, api, Reply, commandName }) {
    const { type, author, formData } = Reply;
    if (event.senderID !== author) return;

    const { threadID, messageID, attachments, body } = event;

    async function uploadAttachments(attachments) {
      let uploads = [];
      for (const attachment of attachments) {
        const form = {
          file: attachment.url,
          filetype: attachment.type,
        };
        uploads.push(api.uploadFile(form));
      }
      uploads = await Promise.all(uploads);
      return uploads;
    }

    if (type === "whoSee") {
      if (!["1", "2", "3"].includes(body)) {
        return api.sendMessage(
          "Please choose 1 of the 3 options above",
          threadID,
          messageID
        );
      }
      formData.input.audience.privacy.base_state =
        body === "1" ? "EVERYONE" : body === "2" ? "FRIENDS" : "SELF";
      api.unsendMessage(messageID);
      api.sendMessage(
        `Reply to this message with the content of the article. If you want to leave it blank, please reply with 0`,
        threadID,
        (e, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            formData,
            type: "content",
          });
        }
      );
    } else if (type === "content") {
      if (body !== "0") {
        formData.input.message.text = body;
      }
      api.unsendMessage(messageID);
      api.sendMessage(
        `Reply to this message with a photo. You can send multiple photos. If you don't want to post pictures, please reply with 0`,
        threadID,
        (e, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            formData,
            type: "image",
          });
        }
      );
    } else if (type === "image") {
      if (body !== "0") {
        const allAttachments = attachments.filter(
          (attach) => attach.type === "photo"
        );
        if (allAttachments.length > 0) {
          const uploadFiles = await uploadAttachments(allAttachments);
          for (const result of uploadFiles) {
            if (result && result[0] && result[0].is_uploaded) {
              formData.input.attachments.push({
                photo: {
                  id: result[0].attachmentID.toString(),
                },
              });
            }
          }
        }
      }

      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "ComposerStoryCreateMutation",
        fb_api_caller_class: "RelayModern",
        doc_id: "7711610262190099",
        variables: JSON.stringify(formData),
      };

      const response = await axios.post(
        "https://www.facebook.com/api/graphql/",
        new URLSearchParams(form).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      api.unsendMessage(messageID);

      try {
        const responseData = response.data.replace("for (;;);", "");
        const info = JSON.parse(responseData);
        const postID = info.data.story_create.story.legacy_story_hideable_id;
        const urlPost = info.data.story_create.story.url;
        if (postID) {
          return api.sendMessage(
            `» Post created successfully\n» postID: ${postID}\n» urlPost: ${urlPost}`,
            threadID
          );
        } else {
          throw new Error("Post creation failed.");
        }
      } catch (error) {
        return api.sendMessage(
          `Post creation failed. Please try again later.`,
          threadID,
          messageID
        );
      }
    }
  },
};

function getGUID() {
  var sectionLength = Date.now();
  var id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.floor((sectionLength + Math.random() * 16) % 16);
    sectionLength = Math.floor(sectionLength / 16);
    var _guid = (c == "x" ? r : (r & 7) | 8).toString(16);
    return _guid;
  });
  return id;
}
