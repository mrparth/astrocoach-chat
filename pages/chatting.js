// components/ChatScreen.js
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import ChatImage from '../components/ChatImage';
import { SENDBIRD_INFO } from '../constants/constants';
import SendbirdChat from '@sendbird/chat'
// import { OpenChannelModule, SendbirdOpenChat } from '@sendbird/chat/openChannel';
import { timestampToTime, handleEnterPress } from '../utils/messageUtils';

import {
    GroupChannelModule,
    GroupChannelFilter,
    GroupChannelListOrder,
    MessageFilter,
    MessageCollectionInitPolicy
} from '@sendbird/chat/groupChannel';

const Chatting = ({ recipient }) => {
    // const [message, setMessage] = useState('');
    // const [media, setMedia] = useState('https://picsum.photos/200');
    const router = useRouter();

    const [state, updateState] = useState({
        currentlyJoinedChannel: null,
        currentlyUpdatingChannel: null,
        messages: [],
        channels: [],
        showChannelCreate: false,
        messageInputValue: "",
        userNameInputValue: "Viral",
        userIdInputValue: "viral@mail.com",
        channelNameInputValue: "",
        settingUpUser: true,
        file: null,
        messageToUpdate: null,
        loading: false,
        error: false,
        recipientData: null,
        sb: null,
        channelObj: null,
        typingMembers: [],
        showLoadMore: true,
        loadMoreBtnClicked: false,
    });

    //need to access state in message received callback
    const stateRef = useRef();
    stateRef.current = state;

    const chatRef = useRef();

    useEffect(() => {
        initSB(localStorage.getItem('userId'));
    }, [])


    useEffect(() => {
        if (state.sb !== null) {
            retriveRecipient(router.query.recipientId);
        }
    }, [state.sb])



    const initSB = async (uid) => {
        const { userNameInputValue, userIdInputValue } = state;
        const sendbirdChat = await SendbirdChat.init({
            appId: SENDBIRD_INFO.appId,
            localCacheEnabled: true,
            modules: [new GroupChannelModule()]
        });

        try {
            await sendbirdChat.connect(uid);
        } catch (e) {
            console.log("error", e)
        }

        await sendbirdChat.setChannelInvitationPreference(true);

        // const userUpdateParams = {};
        // userUpdateParams.nickname = userNameInputValue;
        // userUpdateParams.userId = userIdInputValue;
        // await sendbirdChat.updateCurrentUserInfo(userUpdateParams).then(data => console.log(data));

        updateState({ ...state, sb: sendbirdChat });
    }

    const retriveRecipient = async (uid) => {
        const { sb } = state;
        const queryParams = {
            limit: 1,
            userIdsFilter: [uid]
        };
        const query = sb.createApplicationUserListQuery(queryParams);

        const rData = await query.next();
        
        updateState({ ...state, recipientData: rData });
    }

    useEffect(() => {
        if (state.recipientData !== null) {
            // console.log(state.recipientData[0].userId);
            handleCreateChannel();
        }
    }, [state.recipientData])

    useEffect(() => {
        if (state.channelObj !== null) {
            // enter channel and load message
            handleJoinChannel();

        }
    }, [state.channelObj])



    const handleSendMessage = () => {
        // Handle sending the message and media here (e.g., via API)
        // console.log(`Sending message: ${message}`);
        // console.log(`Sending media:`, media);

        sendMessage();
        // Reset the message input and media
        // setMessage('');
        // setMedia(null);

    };

    const handleMediaUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Handle media upload (e.g., display a preview)
            setMedia(URL.createObjectURL(file));
        }
    };



    const onError = (error) => {
        updateState({ ...state, error: error.message });
        console.log(error);
    }

    const messageHandlers = {
        onMessagesAdded: (context, channel, messages) => {
            const updatedMessages = [...stateRef.current.messages, ...messages];
            updateState({ ...stateRef.current, messages: updatedMessages, loadMoreBtnClicked: false });

        },
        onMessagesUpdated: (context, channel, messages) => {
        },
        onMessagesDeleted: (context, channel, messageIds) => {
        },
        onChannelUpdated: (context, channel) => {
            const members = channel.getTypingUsers();
            if(members && members.length > 0){
                updateState({ ...stateRef.current, typingMembers: members });

            }else{
                updateState({ ...stateRef.current, typingMembers: [] });
            }
        },
        onChannelDeleted: (context, channelUrl) => {
        },
        onHugeGapDetected: () => {
        }
    }

    const handleJoinChannel = async (channelUrl) => {
        // if (state.messageCollection && state.messageCollection.dispose) {
        //     state.messageCollection?.dispose();
        // }

        // if (state.currentlyJoinedChannel?.url === channelUrl) {
        //     return null;
        // }
        const { channelObj } = state;
        updateState({ ...state, loading: true });
        // const channel = channels.find((channel) => channel.url === channelUrl);
        const onCacheResult = (err, messages) => {
            updateState({ ...stateRef.current, currentlyJoinedChannel: channelObj, messages: messages.reverse(), loading: false })

        }

        const onApiResult = (err, messages) => {
            updateState({ ...stateRef.current, currentlyJoinedChannel: channelObj, messages: messages.reverse(), loading: false })
        }

        const collection = loadMessages(channelObj, messageHandlers, onCacheResult, onApiResult);


        updateState({ ...state, messageCollection: collection });
    }



    const loadMessages = (channel, messageHandlers, onCacheResult, onApiResult) => {
        const messageFilter = new MessageFilter();

        const collection = channel.createMessageCollection({
            filter: messageFilter,
            startingPoint: Date.now(),
            limit: 50
        });

        collection.setMessageCollectionHandler(messageHandlers);
        collection
            .initialize(MessageCollectionInitPolicy.CACHE_AND_REPLACE_BY_API)
            .onCacheResult(onCacheResult)
            .onApiResult(onApiResult);
        return collection;
    }

    const scrollToBottom = (item, smooth) => {
        item?.scrollTo({
            top: item.scrollHeight,
            behavior: smooth
        })
    }
    useEffect(() => {
        scrollToBottom(chatRef.current)
    }, [state.currentlyJoinedChannel])

    useEffect(() => {
        if(!state.loadMoreBtnClicked){

            scrollToBottom(chatRef.current, 'smooth')
        }
    }, [state.messages])




    const handleCreateChannel = async () => {
        try {
            const rUserId = state.recipientData[0].userId;
            const rUsertype = state.recipientData[0].metaData.type;

            let channelName = localStorage.getItem('userId').toLowerCase() + '_' + rUserId.toLowerCase();
            if(rUsertype == 'user'){
                channelName = rUserId.toLowerCase() + '_' + localStorage.getItem('userId').toLowerCase();
            }
            const params = {
                channelNameContainsFilter: channelName,
                includeEmpty: true,
            };
            const query = state.sb.groupChannel.createMyGroupChannelListQuery(params);
            const channels = await query.next();

            if (channels.length > 0) {
                // console.log("channle exists");
                updateState({ ...state, channelObj: channels[0] });
            } else {
                //Create chanel
                // console.log("channle created");
                createChannel(channelName, astrologerId)
            }
        } catch (error) {
            console.log(error);
        }

        // console.log(channels);
    }

    const createChannel = async (channelName, astrologerId) => {
        try {
            const groupChannelParams = {};
            groupChannelParams.invitedUserIds = [state.userIdInputValue.toLowerCase(), astrologerId];
            groupChannelParams.name = channelName;
            groupChannelParams.operatorUserIds = [state.userIdInputValue.toLowerCase(), astrologerId];
            const groupChannel = await state.sb.groupChannel.createChannel(groupChannelParams);
            // return [groupChannel, null];
            updateState({ ...state, channelObj: groupChannel });
        } catch (error) {
            return [null, error];
        }
    }

    const onMessageInputChange = (e) => {
        const { currentlyJoinedChannel, messageToUpdate } = state;
        const messageInputValue = e.currentTarget.value;
        // Event should not be triggered if it is an update message in progress
        if (messageToUpdate === null) {
            messageInputValue !== "" ? currentlyJoinedChannel.startTyping() : currentlyJoinedChannel.endTyping();
        }

        updateState({ ...state, messageInputValue:messageInputValue });
    }

    const sendMessage = async () => {
        const { currentlyJoinedChannel, messages } = state;

        const userMessageParams = {};
        userMessageParams.message = state.messageInputValue;
        currentlyJoinedChannel.sendUserMessage(userMessageParams).onSucceeded((message) => {
            const updatedMessages = [...messages, message];
            updateState({ ...state, messages: updatedMessages, messageInputValue: "" });
            scrollToBottom(chatRef.current, 'smooth');
        }).onFailed((error) => {
            console.log(error)
            console.log("failed")
        });

    }
    const onFileInputChange = async (e) => {
        if (e.currentTarget.files && e.currentTarget.files.length > 0) {
            const { currentlyJoinedChannel, messages } = state;
            const fileMessageParams = {};
            fileMessageParams.file = e.currentTarget.files[0];
            currentlyJoinedChannel.sendFileMessage(fileMessageParams)
                .onSucceeded((message) => {
                    updateState({ ...stateRef.current, messageInputValue: "", file: null });
                })
                .onFailed((error) => {
                    console.log(error)
                    console.log("failed")
                });
        }
    }

    if (state.loading) {
        return <div>Loading...</div>
    }

    if (state.error) {
        return <div className="error">{state.error} check console for more information.</div>
    }

    const loadMoreMessages = async () => {
        if (state.messageCollection.hasPrevious) {
            const messages = await state.messageCollection.loadPrevious();
           // Concatenate the new messages array with the current messages array in reverse order
            const updatedMessages = [...messages.reverse(), ...state.messages];

            // Update the state with the updated messages
            updateState({ ...state, messages: updatedMessages, showLoadMore: true, loadMoreBtnClicked: true });
        }else{
            updateState({ ...state, showLoadMore: false });
            
        }
    }

    return (
        <div className="flex flex-col h-screen" >
            {/* Sticky Header */}
            <div className="bg-white p-2 border-b flex items-center">
                <button
                    onClick={() => router.back()}
                    className="back-button mr-4 p-2 rounded-full hover:bg-gray-200 transition duration-300"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-600 hover:text-gray-800 transition duration-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                </button>
                <div className="w-12 h-12 overflow-hidden rounded-full mr-4">
                    {
                        state.recipientData && state.recipientData[0].plainProfileUrl &&
                        <img src={state.recipientData[0].plainProfileUrl} alt="Recipient Avatar" className="object-cover w-full h-full" />

                    }
                </div>
                <div>
                    <p className="text-lg font-semibold">{state.recipientData && state.recipientData[0].nickname ? state.recipientData[0].nickname : 'AstroCoach'}</p>
                    {
                        state.recipientData && state.recipientData[0].connectionStatus &&
                        <p className={state.recipientData[0].connectionStatus == 'online' ? 'text-green-500' : 'text-gray-500'}>
                            {state.recipientData[0].connectionStatus}
                        </p>
                    }
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2" ref={chatRef}>
                {state.showLoadMore && <div className="text-center">
                    <button className="load-more-button" onClick={loadMoreMessages}>Load old messages</button>
                </div>}

                <MessagesList
                    messages={state.messages}
                    sb={state.sb}
                />
            </div>
            {/* Sticky Input Area */}
            <div className="p-2 bg-gray-100 sticky bottom-0" >
            {state.typingMembers.length > 0 && DisplayTypingIndicator(state.typingMembers)}
                <div className="flex items-center space-x-2">
                    <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={onFileInputChange}
                        className="hidden"
                        id="media-upload"
                    />
                    <label htmlFor="media-upload" className="cursor-pointer">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-gray-600 hover:text-gray-800 transition duration-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                    </label>

                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={state.messageInputValue}
                        onChange={onMessageInputChange}
                        // onKeyDown={(event => handleEnterPress(event, sendMessage))}
                        className="flex-1 px-4 py-2 bg-white rounded-full border focus:outline-none focus:border-blue-500"
                    />
                    <button
                        onClick={handleSendMessage}
                        className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition duration-300"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};
const MessagesList = ({ messages, sb }) => {
    return <div className="message-list">
        {messages.map(message => {
            if (!message.sender) return null;
            const messageSentByYou = message.sender.userId === sb.currentUser.userId;
            return (
                <div key={message.messageId} className={`message-item ${messageSentByYou ? 'message-from-you' : ''}`}>
                    <Message
                        message={message}
                        messageSentByYou={messageSentByYou}
                        sb={sb} />
                    <ProfileImage user={message.sender} />
                </div>
            );
        })}
    </div>
}
const ProfileImage = ({ user }) => {
    if (user.plainProfileUrl) {
        return <img className="profile-image" src={user.plainProfileUrl} />
    } else {
        return <div className="profile-image-fallback">{user.nickname.charAt(0)}</div>;
    }
}
const Message = ({ message, messageSentByYou, sb }) => {
    if (message.url) {
        return (
            <div className={`message  ${messageSentByYou ? 'message-from-you' : ''}`}>
                <div className="message-user-info">
                    <div className="message-sender-name">{message.sender.nickname}{' '}</div>
                    <div>{timestampToTime(message.createdAt)}</div>
                </div>
                <img src={message.url} />
            </div >);
    }
    const messageSentByCurrentUser = message.sender.userId === sb.currentUser.userId;

    return (
        <div className={`message  ${messageSentByYou ? 'message-from-you' : ''}`}>
            <div className="message-info">
                <div className="message-user-info">
                    <div className="message-sender-name">{message.sender.nickname}{' '}</div>
                    <div>{timestampToTime(message.createdAt)}</div>
                </div>
            </div>
            <div>{message.message}</div>
        </div>
    );
}

const DisplayTypingIndicator = (typingMembers) => {
    let typingIndicatorText = ""

    typingMembers.length === 1 ? typingIndicatorText = typingMembers[0].nickname + " is typing..." :
        typingMembers.length === 2 ? typingIndicatorText = typingMembers[0].nickname + ", " + typingMembers[1].nickname + " are typing..." :
            typingIndicatorText = typingMembers[0].nickname + ", " + typingMembers[1].nickname + " and others are typing..."

    return (
        <div className='typing-indicator'>{typingIndicatorText}</div>
    )
}

export default Chatting;
