const constants = require('../constants/userCustomAttributes');

exports.daoUserAttributes = (body) => {
  // Create / Update User Custom Attributes
  const customAttributeList = [];

  if (body.name) {
    customAttributeList.push({ Name: 'custom:name', Value: body.name });
  }

  if (body.profileurl) {
    customAttributeList.push({ Name: 'custom:profileurl', Value: body.profileurl });
  }

  if (body.role) {
    customAttributeList.push({ Name: 'custom:role', Value: body.role });
  }

  if (body.email) {
    customAttributeList.push({ Name: 'email', Value: body.email });
  }

  if (body.about) {
    customAttributeList.push({ Name: 'custom:about', Value: body.about });
  }

  if (body.dob) {
    customAttributeList.push({ Name: 'custom:dob', Value: body.dob });
  }

  if (body.source) {
    customAttributeList.push({ Name: 'custom:source', Value: 'custom' });
  }

  if(body.deviceType) {
    customAttributeList.push({ Name: 'custom:deviceType', Value: body.deviceType });
  }

  if (!body.createdBy) {
    customAttributeList.push({ Name: 'custom:createdBy', Value: body.email });
  }

  if (!body.updatedBy) {
    customAttributeList.push({ Name: 'custom:updatedBy', Value: body.email });
  }

  return customAttributeList;
};