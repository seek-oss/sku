import { gql, type TypedDocumentNode } from '@apollo/client';

export type Product = {
  id: string;
  title: string;
};

export type ProductsQueryData = {
  products: Product[];
};

export type Review = {
  id: string;
  body: string;
};

export type ReviewsQueryData = {
  reviews: Review[];
};

export const PRODUCTS_QUERY: TypedDocumentNode<ProductsQueryData> = gql`
  query Products {
    products {
      id
      title
    }
  }
`;

export const REVIEWS_QUERY: TypedDocumentNode<ReviewsQueryData> = gql`
  query Reviews {
    reviews {
      id
      body
    }
  }
`;

export const products: Product[] = [
  { id: '1', title: 'Apollo Beanie' },
  { id: '2', title: 'Streaming Mug' },
];

export const reviews: Review[] = [
  { id: '1', body: 'Hydration works' },
  { id: '2', body: 'Client nav fetches' },
];

type GraphqlBody = {
  operationName?: string | null;
  query?: string;
};

/** Resolve the fixture GraphQL operations without a full server schema. */
export const resolveGraphql = (
  body: GraphqlBody,
): { data: ProductsQueryData | ReviewsQueryData } | { errors: unknown[] } => {
  const name = body.operationName ?? '';
  const query = body.query ?? '';

  if (name === 'Products' || query.includes('query Products')) {
    return { data: { products } };
  }
  if (name === 'Reviews' || query.includes('query Reviews')) {
    return { data: { reviews } };
  }

  return {
    errors: [
      {
        message: `Unknown fixture operation: ${name || query || '(empty)'}`,
      },
    ],
  };
};
