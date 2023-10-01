import Head from 'next/head';
import Image from 'next/image';
import styles from './layout.module.css';
import utilStyles from '../styles/utils.module.css';
import Link from 'next/link';

const name = 'AstroCoach';
export const siteTitle = 'Next.js Sample Website';

export default function Layout({ children, home }) {
    return (
        <div>
            <main>{children}</main>
        </div>
    );
}
