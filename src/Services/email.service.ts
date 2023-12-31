import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";
import {BadRequestException} from "@nestjs/common";
import {EmailConfirmationType, UserSQL} from "../Types/types";
import * as uuid from 'uuid'
import {emailAdapter} from "../Utils/email-adapter";
import bcrypt from "bcrypt";
export class EmailService {
    constructor(@InjectDataSource() protected dataSource: DataSource) {}

    async confirmEmail(payload) {
        const {code} = payload
        if(!code) throw new BadRequestException([{message: 'code is required', field: "code"}])
        const user: UserSQL[] = await this.dataSource.query(
        `SELECT * FROM "Users" u where u."confirmationCode" = $1`,
            [code])

        if(!user.length) throw new BadRequestException([{message: 'invalid code', field: "code"}])
        if (user[0].isConfirmed) throw new BadRequestException([{ message: 'already confirmed', field: "code" }])

        await this.dataSource.query(
            `UPDATE "Users"
            SET "isConfirmed" = true where "confirmationCode" = $1`,
            [code])

    }
    async confirmationCodeResending(payload) {
        const {email} = payload
        if(!email) throw new BadRequestException([{message: 'email is required', field: "email"}])

        const user: UserSQL[] = await this.dataSource.query(`
        SELECT * FROM "Users" where email = $1
        `, [email])

        if(!user.length)throw new BadRequestException(
            [{message: 'user with that email does not exist', field: "email"}])

        if(user[0].isConfirmed) throw new BadRequestException(
            [{ message: 'already confirmed', field: "email" }])

        const newCode = uuid.v4()
        await this.dataSource.query(`
        UPDATE "Users" SET "confirmationCode" = $1 where email = $2
        `, [newCode, email])

        const message = `<h1>Thank for your registration</h1>
    <p>To finish registration please follow the link below:
        <a href=https://somesite.com/confirm-email?code=${newCode}>complete registration</a>
    </p>`
        await emailAdapter.sendEmail(email, 'email confirmation', message)
    }

    async recoveryCode(email) {
        const AccountData = await this.dataSource.query(`
        SELECT * FROM "Users" where email = $1`, [email])

        if(!AccountData )throw new BadRequestException(
            [{message: 'user with that email does not exist', field: "email"}])
        else {
            const recoveryCode = uuid.v4()
            const {userId} = AccountData

            await this.dataSource.query(
        `UPDATE "Users" SET "recoveryCode" = $2 where id = $1`,
           [userId, recoveryCode])

            const subject = 'Password Recovery'
            const message = `<h1>Password recovery</h1>
       <p>To finish password recovery please follow the link below:
          <a href=https://somesite.com/password-recovery?recoveryCode=${recoveryCode}>recovery password</a>
      </p>`
            await emailAdapter.sendEmail(email, subject, message)
        }
    }

    async getNewPassword(payload) {
        const {newPassword, recoveryCode} = payload
        if(!recoveryCode) throw new BadRequestException(
            [{message: 'recoveryCode is required', field: "recoveryCode"}])

        const newRecoveryCode = uuid.v4()
        const passwordSalt = await bcrypt.genSalt(10)
        const newPasswordHash = await bcrypt.hash(newPassword, passwordSalt)

        await this.dataSource.query(`
        UPDATE "Users" SET "passwordHash" = $1, "recoveryCode" = $2 where "recoveryCode" = $3`,
            [newPasswordHash, newRecoveryCode, recoveryCode])
    }
}