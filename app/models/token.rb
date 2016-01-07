class Token < ActiveRecord::Base
  def self.expire_old_tokens
    self.where("expiration < ?", DateTime.now).destroy_all
  end

  def expired
    expiration < Time.now
  end
end
