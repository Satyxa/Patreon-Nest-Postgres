import jwt from 'jsonwebtoken'
import {UnauthorizedException} from "@nestjs/common";

const secretKey = 'gergergergerg'

export const getResultByToken = (refreshToken: string) : {userId: string, deviceId: string, iat: number} | null => {
    try {
        return jwt.verify(refreshToken, secretKey) as {userId: string, deviceId: string, iat: number}
    } catch (err){
        console.log(err, `=> getResultByToken (file authentication)`)
        throw new UnauthorizedException()
    }
}

export const createToken = async (id: string, deviceId: string, ip: string, exp: string) => {
    return jwt.sign({userId: id, ip, deviceId}, secretKey, {expiresIn: exp})

}
//
// export const findUserByLoginOrEmail = async (loginOrEmail, UserModel): Promise<User | null>  => {
//     const filter = {$or: [{'AccountData.email': loginOrEmail}, {'AccountData.username': loginOrEmail}]}
//     return await UserModel.findOne(filter)
// }