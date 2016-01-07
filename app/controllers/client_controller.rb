require 'securerandom'

class ClientController < ApplicationController
  def index
    if (!session[:token] || !validate_token(session[:token]))
      redirect_to '/auth/cas'
    end
    @token = session[:token]
  end

  def login
    if valid_user(request.env['omniauth.auth']['uid'])
      token = Token.create(token: SecureRandom.uuid, expiration: Time.new + (60 * 60 * 24))
      # Expire old tokens on login; might be better to do this through a rake
      # task, but doing it here ensures we don't forget about it, and this should
      # not be a very expensive operation.
      Token.expire_old_tokens
      session[:token] = token.token
      redirect_to '/'
    end
  end

  def logout
    if (session[:token])
      Token.where(token: session[:token]).destroy_all
    end
  end

  private

  def valid_user(username)
    config = Rails.application.config_for(:vudl)
    list = config["user_whitelist"]
    list == "*" || list == username || (list.is_a?(Array) && list.include?(username))
  end
end
