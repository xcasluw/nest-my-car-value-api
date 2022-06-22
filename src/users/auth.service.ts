import { BadRequestException, Injectable } from "@nestjs/common";
import { UsersService } from "./users.service";
import { randomBytes, scrypt as _scrypt } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt)

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    // See if email is in use
    const users = await this.usersService.find(email)
    if (users.length) {
      throw new BadRequestException('email in use')
    }

    // Hash the password
    const salt = randomBytes(8).toString('hex')
    const hash = (await scrypt(password, salt, 32)) as Buffer
    const result = salt + '.' + hash.toString('hex')

    // Create a new user and save it
    const user = await this.usersService.create(email, result)

    // Return the user
    return user
  }

  signin() {

  }
}
