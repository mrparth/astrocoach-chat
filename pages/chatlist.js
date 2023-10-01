import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout, { siteTitle } from '../components/layout';
import SendbirdChat from '@sendbird/chat'
import { OpenChannelModule, SendbirdOpenChat } from '@sendbird/chat/openChannel';
import { ConnectionHandler } from '@sendbird/chat';
import { useRouter } from 'next/router';
import {
    GroupChannelModule,
    GroupChannelFilter,
    GroupChannelListOrder,
    MessageFilter,
    MessageCollectionInitPolicy
} from '@sendbird/chat/groupChannel';

import { SENDBIRD_INFO } from '../constants/constants';
import utilStyles from '../styles/utils.module.css';

export default function Chatlist() {
    const router = useRouter();
    const [recipientList, setRecipientList] = useState([]);
    const [loginUserId, setLoginUserId] = useState(null);
    const [loginUserType, setLoginUserType] = useState(null);
    const loadUsers = async () => {
        // const { userNameInputValue, userIdInputValue } = state;

        const sb = await SendbirdChat.init({
            appId: SENDBIRD_INFO.appId,
            localCacheEnabled: true,
            modules: [new GroupChannelModule()]
        });
        
        try {
            const user = await sb.connect(loginUserId);
            // const user = await sb.connect('sendbird_desk_agent_id_9febf9e6-57f9-465b-a6c1-05a0d2fff1eb', '3930ca2f310de90a8bee78ac135657dc93977b98');
            // console.log(user);
        } catch (e) {
            console.log("error", e)
        }
        // await sendbirdChat.setChannelInvitationPreference(true);

        // const userUpdateParams = {};
        // userUpdateParams.nickname = userNameInputValue;
        // userUpdateParams.userId = userIdInputValue;
        // await sendbirdChat.updateCurrentUserInfo(userUpdateParams);

        // updateState({ ...state, loading: true });
        // const [channels, error] = await loadChannels();
        // if (error) {
        //     return onError(error);
        // }
        // updateState({ ...state, channels: channels, loading: false, settingUpUser: false });

        const queryParams = {
            limit: 20,
            metaDataKeyFilter: 'type',
            metaDataValuesFilter:[loginUserType == 'user' ? 'astrologer' : 'user']
        };
        const query = sb.createApplicationUserListQuery(queryParams);
        
        const users = await query.next();
        setRecipientList(users);
    }
    useEffect(() => {
        // loadUsers();
        setLoginUserId(router.query.user_id);
        setLoginUserType(router.query.user_type);
        localStorage.setItem('userId', router.query.user_id);
        localStorage.setItem('userType', router.query.user_type);

    }, [])

    useEffect(() => {
        if(loginUserId !== null && loginUserType !== null) {
            loadUsers();
        }
    }, [loginUserId, loginUserType])

    return (
        <Layout chatlist>
            <Head>
                <title>{siteTitle}</title>
            </Head>
            <div className="flex flex-col space-y-4 p-2">
                {recipientList.map((item, index) => (
                    <Link href={{ pathname: '/chatting', query: { recipientId: item.userId } }} key={index}>
                        <div  className="bg-white rounded-lg p-2 shadow-md flex items-center cursor-pointer hover:bg-gray-100 transition duration-300">
                            <div className="w-16 h-16 bg-gray-300 rounded-full mr-4">
                                <img
                                    src={item.plainProfileUrl} // Use the URL or path to the avatar image
                                    className="w-full h-full rounded-full"
                                />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">{item.nickname}</p>
                                <p className="text-gray-500">{item.connectionStatus}</p>
                            </div>
                            <div className="flex-2 content-end">
                                
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </Layout>
    );
}