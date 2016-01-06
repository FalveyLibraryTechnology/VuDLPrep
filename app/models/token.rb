class Token < ActiveRecord::Base
  def expired
    expiration < Time.now
  end
end
