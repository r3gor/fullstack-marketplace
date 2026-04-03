import type { Schema, Struct } from '@strapi/strapi';

export interface ProductDimensions extends Struct.ComponentSchema {
  collectionName: 'components_product_dimensions';
  info: {
    displayName: 'Dimensions';
    icon: 'expand';
  };
  attributes: {
    depth: Schema.Attribute.Decimal;
    height: Schema.Attribute.Decimal;
    width: Schema.Attribute.Decimal;
  };
}

export interface ProductMeta extends Struct.ComponentSchema {
  collectionName: 'components_product_metas';
  info: {
    displayName: 'Meta';
    icon: 'information';
  };
  attributes: {
    barcode: Schema.Attribute.String;
    qrCode: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'product.dimensions': ProductDimensions;
      'product.meta': ProductMeta;
    }
  }
}
