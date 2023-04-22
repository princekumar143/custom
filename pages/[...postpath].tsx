import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const endpoint = process.env.GRAPHQL_ENDPOINT as string;
  const graphQLClient = new GraphQLClient(endpoint);
  const pathArr = ctx.query.postpath as Array<string>;
  const path = pathArr.join('/');
  const fbclid = ctx.query.fbclid;

  // redirect if facebook is the referer or request contains fbclid
  if (ctx.req.headers?.referer?.includes('facebook.com') || fbclid) {
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
        content
        featuredImage {
          node {
            sourceUrl
            altText
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
      post: data.post,
      host: ctx.req.headers.host,
    },
  };
};

interface PostProps {
  post: any;
  host: string;
}

const Post: React.FC<PostProps> = (props) => {
  const { post, host } = props;

  return (
    <>
      <Head>
        <meta property="og:image" content={post.featuredImage.node.sourceUrl} />
        <meta property="og:image:alt" content={post.featuredImage.node.altText} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content={host.split('.')[0]} />
      </Head>
      <div className="post-container">
        <img
          src={post.featuredImage.node.sourceUrl}
          alt={post.featuredImage.node.altText}
        />
        <article dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </>
  );
};

export default Post;
