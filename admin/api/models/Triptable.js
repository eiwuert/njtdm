/**
* Triptable.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	name:'string',
  	info:'string',
  	trips:'array',
  	isFinished:{
      type: 'boolean',
      defaultsTo: false
    },
  	marketareaId:'integer',
  }

};

