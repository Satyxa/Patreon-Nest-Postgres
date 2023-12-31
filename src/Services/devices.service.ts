import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";
import {BadRequestException, HttpException, UnauthorizedException} from "@nestjs/common";
import {EmailConfirmationType, SessionsType} from "../Types/types";
import {getResultByToken} from "../Utils/authentication";

export class DevicesService {
    constructor(@InjectDataSource() protected dataSource: DataSource) {}

    async deleteAll(){
        return await this.dataSource.query(`
        DELETE FROM "Sessions"
        `)
    }

    async getDevices(refreshToken){
        if(!getResultByToken(refreshToken)) throw new UnauthorizedException()
        const tokenPayload: any = getResultByToken(refreshToken)

        const sessions: SessionsType[] = await this.dataSource.query(`
        SELECT "ip", "deviceId", "title", "lastActiveDate" 
        FROM "Sessions" 
        where "userId" = $1`, [tokenPayload.userId])

        if(!sessions.length) throw new UnauthorizedException()
        return sessions
    }

    async deleteDevices(refreshToken) {
        if (!getResultByToken(refreshToken)) throw new UnauthorizedException()
        const tokenPayload = getResultByToken(refreshToken)
        if (!tokenPayload) throw new UnauthorizedException()

        const {deviceId} = tokenPayload
        await this.dataSource.query(
            `DELETE FROM "Sessions" 
        where "userId" = $1 AND "deviceId" != $2`,
            [tokenPayload.userId, deviceId])
    }

    async deleteDevice(deviceId, refreshToken){
        if(!getResultByToken(refreshToken)) throw new UnauthorizedException()
        const tokenPayload: any = getResultByToken(refreshToken)

        const device = await this.dataSource.query(`
        SELECT * FROM "Sessions" where "deviceId" = $1`,
            [deviceId])

        if(!device.length) throw new HttpException('NOT FOUND', 404)
        if(tokenPayload.userId !== device[0].userId) throw new HttpException('FORBIDDEN', 403)
        await this.dataSource.query(
            `DELETE FROM "Sessions" where "deviceId" = $1`,
            [deviceId])
    }
}