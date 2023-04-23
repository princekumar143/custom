import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const endpoint = process.env.GRAPHQL_ENDPOINT as string;
  const graphQLClient = new GraphQLClient(endpoint);
  const referringURL = ctx.req.headers?.referer || null;
  const pathArr = ctx.query.postpath as Array<string>;
  const path = pathArr.join('/');
  console.log(path);
  const fbclid = ctx.query.fbclid;

  // redirect if facebook is the referer or request contains fbclid
  if (referringURL?.includes('facebook.com') || fbclid) {
    return {
      redirect: {
        permanent: false,
        destination: `${endpoint.replace(/(\/graphql\/)/, '/') + encodeURI(path as string)}`,
      },
    };
  }

  const query = gql`
    {
      post(id: "/${path}/", idType: URI) {
        id
        dateGmt
        modifiedGmt
        content
        author {
          node {
            name
          }
        }
        featuredImage {
          node {
            sourceUrl
          }
        }
      }
    }
  `;

  const data = await graphQLClient.request(query);
  if (!data.post) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      path,
      post: data.post,
      host: ctx.req.headers.host,
    },
  };
};

interface PostProps {
  post: any;
  host: string;
  path: string;
}

const Post: React.FC<PostProps> = (props) => {
  const { post, host, path } = props;

  return (
    <>
      <Head>
        <meta property="og:image" content={post.featuredImage.node.sourceUrl} />
        <link rel="canonical" href={`https://${host}/${path}`} />
        <meta property="og:url" content={`https://${host}/${path}`} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content={host.split('.')[0]} />
        <meta property="article:published_time" content={post.dateGmt} />
        <meta property="article:modified_time" content={post.modifiedGmt} />
      </Head>
      <div className="post-container">
        <img
          src={post.featuredImage.node.sourceUrl}
          alt=""
        />
        <article dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </>
  );
};

export default Post;
