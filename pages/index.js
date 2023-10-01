import Head from 'next/head';
import Layout, { siteTitle } from '../components/layout';
import utilStyles from '../styles/utils.module.css';
import Link from 'next/link';


export default function Home() {
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <p className="text-red-700">Welcome Screen</p>
        <Link href="/chatlist?user_id=viral@mail.com&user_type=user">Login As User</Link><br/>
        <Link href="/chatlist?user_id=a@mail.com&user_type=astrologer">Login As Astrologer</Link>
        
      </section>
    </Layout>
  );
}