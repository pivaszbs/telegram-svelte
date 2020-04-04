export default class qSyncModule {
	when(result) {
		return {
			then: function(cb) {
				return cb(result);
			},
		};
	}
	reject(result) {
		return {
			then: function(cb, badcb) {
				if (badcb) {
					return badcb(result);
				}
			},
		};
	}
}
