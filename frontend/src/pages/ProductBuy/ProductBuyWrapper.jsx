import React from "react";
import { useParams } from "react-router-dom";
import ProductBuy from "./ProductBuy";

const ProductBuyWrapper = () => {
  const { productId } = useParams();
  return <ProductBuy productId={productId} />;
};

export default ProductBuyWrapper;
