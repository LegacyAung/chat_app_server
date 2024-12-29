export const encodeId = (userId:string):string=> {
    return btoa(userId);
}

export const decodeId = (encodedId:string):string=> {
    return atob(encodedId);
}